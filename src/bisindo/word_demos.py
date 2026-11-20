"""Prepare looping BISINDO word demo animations and upload them to Supabase."""

from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
import subprocess
from typing import Any
from urllib.error import HTTPError
from urllib.parse import quote, urlparse
import urllib.request

from bisindo.dataset import VIDEO_EXTS

DEFAULT_BUCKET = "bisindo-word-demos"
DEFAULT_TABLE = "bisindo_word_demos"

FORMAT_MIME_TYPES: dict[str, str] = {
    "mp4": "video/mp4",
    "webm": "video/webm",
    "webp": "image/webp",
}


@dataclass(frozen=True)
class WordDemoSpec:
    """Metadata for a single BISINDO dynamic word class."""

    word_id: str
    title: str


@dataclass(frozen=True)
class EncodedWordDemo:
    """Prepared animation asset ready to upload to Supabase Storage."""

    word_id: str
    title: str
    output_path: Path
    mime_type: str
    object_name: str


WORD_DEMO_SPECS: tuple[WordDemoSpec, ...] = (
    WordDemoSpec(word_id="pantai", title="Pantai"),
    WordDemoSpec(word_id="belajar", title="Belajar"),
    WordDemoSpec(word_id="hari", title="Hari"),
    WordDemoSpec(word_id="maaf", title="Maaf"),
    WordDemoSpec(word_id="makan", title="Makan"),
    WordDemoSpec(word_id="saya", title="Saya"),
    WordDemoSpec(word_id="terima_kasih", title="Terima Kasih"),
    WordDemoSpec(word_id="tuli", title="Tuli"),
)


def discover_source_videos(
    raw_dir: str | Path,
    word_ids: list[str] | tuple[str, ...] | None = None,
) -> dict[str, Path]:
    """Select one representative source video per requested word class."""
    root = Path(raw_dir)
    targets = list(word_ids) if word_ids is not None else [s.word_id for s in WORD_DEMO_SPECS]
    selected: dict[str, Path] = {}

    for word_id in targets:
        class_dir = root / word_id
        if not class_dir.is_dir():
            continue

        candidates = sorted(
            p for p in class_dir.iterdir() if p.is_file() and p.suffix.lower() in VIDEO_EXTS
        )
        if not candidates:
            continue

        exact_match = [p for p in candidates if p.stem.lower() == word_id.lower()]
        if exact_match:
            selected[word_id] = exact_match[0]
        else:
            # Prefer the largest clip (typically longest and highest clarity in raw recordings)
            selected[word_id] = max(candidates, key=lambda p: (p.stat().st_size, p.name))

    return selected


def probe_video_dimensions(video_path: str | Path) -> tuple[int, int]:
    """Return `(width, height)` for the first video stream using ffprobe."""
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "json",
        str(video_path),
    ]
    proc = subprocess.run(cmd, check=True, capture_output=True, text=True)
    payload = json.loads(proc.stdout)
    streams = payload.get("streams") or []
    if not streams:
        raise ValueError(f"No video stream found in {video_path}")
    return int(streams[0]["width"]), int(streams[0]["height"])


def build_ffmpeg_command(
    input_path: str | Path,
    output_path: str | Path,
    *,
    fmt: str = "mp4",
    width: int | None = None,
    height: int | None = None,
    max_width: int = 480,
    fps: int = 24,
) -> list[str]:
    """Build an ffmpeg command for compact, web-ready looping animations."""
    fmt_lower = fmt.lower().strip()
    if fmt_lower not in FORMAT_MIME_TYPES:
        raise ValueError(f"Unsupported format {fmt!r}; expected one of {sorted(FORMAT_MIME_TYPES)}")

    filters: list[str] = []
    if width and height and height > width:
        # Center-crop portrait clips to square around the upper torso/head so gestures fill the card
        crop_side = width - (width % 2)
        y_offset = int(round((height - crop_side) * 0.52))
        filters.append(f"crop={crop_side}:{crop_side}:0:{y_offset}")

    effective_max_w = max_width - (max_width % 2)
    filters.append(f"scale='min({effective_max_w},iw)':-2:flags=lanczos")
    filters.append(f"fps={fps}")
    vf_arg = ",".join(filters)

    base = [
        "ffmpeg",
        "-y",
        "-v",
        "error",
        "-i",
        str(input_path),
        "-an",
        "-vf",
        vf_arg,
    ]

    if fmt_lower == "mp4":
        return [
            *base,
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "26",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(output_path),
        ]

    if fmt_lower == "webm":
        return [
            *base,
            "-c:v",
            "libvpx-vp9",
            "-b:v",
            "0",
            "-crf",
            "34",
            "-pix_fmt",
            "yuv420p",
            str(output_path),
        ]

    # Animated WebP fallback (if rendered via <img>)
    return [
        *base,
        "-c:v",
        "libwebp",
        "-lossless",
        "0",
        "-compression_level",
        "5",
        "-q:v",
        "72",
        "-loop",
        "0",
        str(output_path),
    ]


def encode_word_demo(
    spec: WordDemoSpec,
    source_path: str | Path,
    output_dir: str | Path,
    *,
    fmt: str = "mp4",
    max_width: int = 480,
    fps: int = 24,
) -> EncodedWordDemo:
    """Encode a single source video into a lightweight web looping animation."""
    fmt_lower = fmt.lower().strip()
    if fmt_lower not in FORMAT_MIME_TYPES:
        raise ValueError(f"Unsupported format {fmt!r}")

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    object_name = f"{spec.word_id}.{fmt_lower}"
    output_path = out_dir / object_name

    width, height = probe_video_dimensions(source_path)
    cmd = build_ffmpeg_command(
        source_path,
        output_path,
        fmt=fmt_lower,
        width=width,
        height=height,
        max_width=max_width,
        fps=fps,
    )
    subprocess.run(cmd, check=True)
    return EncodedWordDemo(
        word_id=spec.word_id,
        title=spec.title,
        output_path=output_path,
        mime_type=FORMAT_MIME_TYPES[fmt_lower],
        object_name=object_name,
    )


def prepare_all_word_demos(
    raw_dir: str | Path,
    output_dir: str | Path,
    *,
    fmt: str = "mp4",
    specs: tuple[WordDemoSpec, ...] = WORD_DEMO_SPECS,
) -> list[EncodedWordDemo]:
    """Encode all 8 BISINDO word demo videos from `raw_dir` into `output_dir`."""
    sources = discover_source_videos(raw_dir, word_ids=[s.word_id for s in specs])
    missing = [s.word_id for s in specs if s.word_id not in sources]
    if missing:
        raise FileNotFoundError(
            f"Missing raw video folders/clips for word classes: {', '.join(missing)}"
        )

    return [
        encode_word_demo(spec, sources[spec.word_id], output_dir, fmt=fmt)
        for spec in specs
    ]


def _normalize_supabase_url(supabase_url: str) -> str:
    cleaned = supabase_url.strip().rstrip("/")
    parsed = urlparse(cleaned)
    if parsed.scheme not in {"https", "http"} or not parsed.netloc:
        raise ValueError(
            f"Invalid Supabase URL {supabase_url!r}: expected an https:// or http:// origin."
        )
    return cleaned


def build_public_storage_url(supabase_url: str, bucket: str, object_name: str) -> str:
    """Construct the public Supabase Storage URL for an uploaded animation."""
    base = _normalize_supabase_url(supabase_url)
    clean_bucket = quote(bucket.strip("/"), safe="")
    clean_obj = quote(object_name.lstrip("/"), safe="/")
    return f"{base}/storage/v1/object/public/{clean_bucket}/{clean_obj}"


def build_word_demo_row(
    demo: EncodedWordDemo,
    supabase_url: str,
    bucket: str = DEFAULT_BUCKET,
) -> dict[str, str]:
    """Build a PostgREST row payload for `public.bisindo_word_demos`."""
    public_url = build_public_storage_url(supabase_url, bucket, demo.object_name)
    return {
        "word_id": demo.word_id,
        "title": demo.title,
        "video_url": public_url,
        "mime_type": demo.mime_type,
        "storage_path": f"{bucket.strip('/')}/{demo.object_name.lstrip('/')}",
    }


def load_env_file(env_path: str | Path) -> dict[str, str]:
    """Parse simple KEY=VALUE pairs from a local `.env.local` file."""
    path = Path(env_path)
    if not path.is_file():
        return {}

    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip()
        if len(val) >= 2 and val[0] == val[-1] and val[0] in {"'", '"'}:
            val = val[1:-1]
        values[key] = val
    return values


def upload_file_to_supabase_storage(
    *,
    supabase_url: str,
    service_role_key: str,
    bucket: str,
    object_name: str,
    file_path: str | Path,
    mime_type: str,
    timeout: int = 60,
) -> str:
    """Upload or overwrite a file in a Supabase Storage bucket and return its public URL."""
    base = _normalize_supabase_url(supabase_url)
    clean_bucket = quote(bucket.strip("/"), safe="")
    clean_obj = quote(object_name.lstrip("/"), safe="/")
    endpoint = f"{base}/storage/v1/object/{clean_bucket}/{clean_obj}"
    payload = Path(file_path).read_bytes()

    req = urllib.request.Request(
        endpoint,
        data=payload,
        method="POST",
        headers={
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": mime_type,
            "Cache-Control": "public, max-age=31536000",
            "x-upsert": "true",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status >= 300:
                raise RuntimeError(f"Supabase Storage upload failed ({resp.status})")
            resp.read()
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"Supabase Storage upload failed for {object_name} ({exc.code}): {detail}"
        ) from exc

    return build_public_storage_url(base, bucket, object_name)


def upsert_word_demo_rows(
    *,
    supabase_url: str,
    service_role_key: str,
    rows: list[dict[str, Any]],
    table: str = DEFAULT_TABLE,
    timeout: int = 30,
) -> None:
    """Upsert public video URLs into `public.bisindo_word_demos`."""
    base = _normalize_supabase_url(supabase_url)
    clean_table = quote(table.strip(), safe="")
    endpoint = f"{base}/rest/v1/{clean_table}?on_conflict=word_id"
    body = json.dumps(rows).encode("utf-8")

    req = urllib.request.Request(
        endpoint,
        data=body,
        method="POST",
        headers={
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status >= 300:
                raise RuntimeError(f"Supabase DB upsert failed ({resp.status})")
            resp.read()
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"Supabase DB upsert failed ({exc.code}): {detail}"
        ) from exc
