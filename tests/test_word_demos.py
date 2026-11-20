"""Unit tests for BISINDO word demo video preparation and Supabase upload."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from bisindo.word_demos import (
    DEFAULT_BUCKET,
    WORD_DEMO_SPECS,
    EncodedWordDemo,
    build_ffmpeg_command,
    build_public_storage_url,
    build_word_demo_row,
    discover_source_videos,
    load_env_file,
    upload_file_to_supabase_storage,
    upsert_word_demo_rows,
)


def test_word_demo_specs_match_wl_labels_and_exclude_air():
    labels_path = Path("public/models/bisindo/bisindo_wl_labels.json")
    labels = json.loads(labels_path.read_text(encoding="utf-8"))["labels"]
    spec_ids = [spec.word_id for spec in WORD_DEMO_SPECS]

    assert spec_ids == labels
    assert "pantai" in spec_ids
    assert "air" not in spec_ids


def test_discover_source_videos_selects_exact_or_largest_candidate(tmp_path: Path):
    # Create exact match for belajar, multiple clips for pantai, and ignored air folder
    (tmp_path / "belajar").mkdir()
    (tmp_path / "belajar" / "belajar.mp4").write_bytes(b"1234")
    (tmp_path / "belajar" / "other.mp4").write_bytes(b"123456789")

    (tmp_path / "pantai").mkdir()
    (tmp_path / "pantai" / "clip_small.mp4").write_bytes(b"123")
    (tmp_path / "pantai" / "clip_best.mp4").write_bytes(b"1234567890")

    (tmp_path / "air").mkdir()
    (tmp_path / "air" / "air.mp4").write_bytes(b"1234")

    found = discover_source_videos(tmp_path, word_ids=["pantai", "belajar"])

    assert found["belajar"] == tmp_path / "belajar" / "belajar.mp4"
    assert found["pantai"] == tmp_path / "pantai" / "clip_best.mp4"
    assert "air" not in found


def test_build_ffmpeg_command_mp4_portrait_applies_crop_and_faststart(tmp_path: Path):
    src = tmp_path / "pantai.mp4"
    dst = tmp_path / "out.mp4"

    cmd = build_ffmpeg_command(src, dst, fmt="mp4", width=478, height=850)

    assert cmd[0] == "ffmpeg"
    assert "-an" in cmd
    assert "+faststart" in cmd
    assert "libx264" in cmd
    vf_idx = cmd.index("-vf") + 1
    assert "crop=" in cmd[vf_idx]
    assert cmd[-1] == str(dst)


def test_build_ffmpeg_command_landscape_mp4_and_webp(tmp_path: Path):
    src = tmp_path / "belajar.mp4"
    mp4_cmd = build_ffmpeg_command(src, tmp_path / "belajar.mp4", fmt="mp4", width=540, height=304)
    webp_cmd = build_ffmpeg_command(src, tmp_path / "belajar.webp", fmt="webp", width=540, height=304)

    mp4_vf = mp4_cmd[mp4_cmd.index("-vf") + 1]
    assert "crop=" not in mp4_vf
    assert "libwebp" in webp_cmd
    assert "-loop" in webp_cmd


def test_build_public_storage_url_and_row():
    url = build_public_storage_url(
        "https://demo-project.supabase.co/",
        DEFAULT_BUCKET,
        "pantai.mp4",
    )
    assert url == "https://demo-project.supabase.co/storage/v1/object/public/bisindo-word-demos/pantai.mp4"

    demo = EncodedWordDemo(
        word_id="pantai",
        title="Pantai",
        output_path=Path("exports/word_demos/pantai.mp4"),
        mime_type="video/mp4",
        object_name="pantai.mp4",
    )
    row = build_word_demo_row(demo, "https://demo-project.supabase.co", DEFAULT_BUCKET)
    assert row == {
        "word_id": "pantai",
        "title": "Pantai",
        "video_url": url,
        "mime_type": "video/mp4",
        "storage_path": "bisindo-word-demos/pantai.mp4",
    }


def test_build_public_storage_url_rejects_invalid_scheme():
    with pytest.raises(ValueError, match="https://"):
        build_public_storage_url("javascript:alert(1)", DEFAULT_BUCKET, "pantai.mp4")


def test_load_env_file_parses_quotes_and_skips_comments(tmp_path: Path):
    env_file = tmp_path / ".env.local"
    env_file.write_text(
        '# comment\nNEXT_PUBLIC_SUPABASE_URL="https://abc.supabase.co"\nSUPABASE_SERVICE_ROLE_KEY=\'secret_key\'\nEMPTY=\n',
        encoding="utf-8",
    )
    parsed = load_env_file(env_file)
    assert parsed["NEXT_PUBLIC_SUPABASE_URL"] == "https://abc.supabase.co"
    assert parsed["SUPABASE_SERVICE_ROLE_KEY"] == "secret_key"
    assert parsed["EMPTY"] == ""


def test_upload_and_upsert_call_expected_supabase_endpoints(tmp_path: Path):
    video_file = tmp_path / "pantai.mp4"
    video_file.write_bytes(b"fake-mp4-bytes")

    mock_resp = MagicMock()
    mock_resp.status = 200
    mock_resp.read.return_value = b'{"Key":"bisindo-word-demos/pantai.mp4"}'
    mock_resp.__enter__.return_value = mock_resp
    mock_resp.__exit__.return_value = None

    with patch("bisindo.word_demos.urllib.request.urlopen", return_value=mock_resp) as mock_open:
        public_url = upload_file_to_supabase_storage(
            supabase_url="https://demo.supabase.co",
            service_role_key="service-role-secret",
            bucket=DEFAULT_BUCKET,
            object_name="pantai.mp4",
            file_path=video_file,
            mime_type="video/mp4",
        )
        assert public_url == "https://demo.supabase.co/storage/v1/object/public/bisindo-word-demos/pantai.mp4"
        req = mock_open.call_args[0][0]
        assert req.full_url == "https://demo.supabase.co/storage/v1/object/bisindo-word-demos/pantai.mp4"
        assert req.get_header("X-upsert") == "true"
        assert req.get_header("Content-type") == "video/mp4"

    with patch("bisindo.word_demos.urllib.request.urlopen", return_value=mock_resp) as mock_open:
        rows = [
            {
                "word_id": "pantai",
                "title": "Pantai",
                "video_url": "https://demo.supabase.co/storage/v1/object/public/bisindo-word-demos/pantai.mp4",
                "mime_type": "video/mp4",
                "storage_path": "bisindo-word-demos/pantai.mp4",
            }
        ]
        upsert_word_demo_rows(
            supabase_url="https://demo.supabase.co",
            service_role_key="service-role-secret",
            rows=rows,
        )
        req = mock_open.call_args[0][0]
        assert req.full_url == "https://demo.supabase.co/rest/v1/bisindo_word_demos?on_conflict=word_id"
        assert json.loads(req.data.decode("utf-8")) == rows
