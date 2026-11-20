"""Prepare looping BISINDO word demo animations and upload them to Supabase Storage + DB.

Usage:
  1) Encode lightweight looping animations only (no Supabase credentials needed):
     python scripts/upload_word_demos_supabase.py --prepare-only

  2) Encode & upload to Supabase Storage public bucket + upsert URLs to public.bisindo_word_demos:
     python scripts/upload_word_demos_supabase.py --env-file .env.local
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys

from bisindo.word_demos import (
    DEFAULT_BUCKET,
    DEFAULT_TABLE,
    FORMAT_MIME_TYPES,
    WORD_DEMO_SPECS,
    EncodedWordDemo,
    build_word_demo_row,
    load_env_file,
    prepare_all_word_demos,
    upload_file_to_supabase_storage,
    upsert_word_demo_rows,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Encode BISINDO word dataset videos and upload to Supabase Storage + DB."
    )
    parser.add_argument(
        "--raw-dir",
        type=Path,
        default=Path("data/raw_word_videos"),
        help="Directory containing per-class raw video folders (default: data/raw_word_videos)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("exports/word_demos"),
        help="Directory to write optimized looping animations (default: exports/word_demos)",
    )
    parser.add_argument(
        "--format",
        choices=sorted(FORMAT_MIME_TYPES),
        default="mp4",
        help="Target animation format: mp4 (recommended), webm, or animated webp",
    )
    parser.add_argument(
        "--bucket",
        default=DEFAULT_BUCKET,
        help=f"Supabase Storage public bucket name (default: {DEFAULT_BUCKET})",
    )
    parser.add_argument(
        "--table",
        default=DEFAULT_TABLE,
        help=f"Supabase Postgres table name (default: {DEFAULT_TABLE})",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=Path(".env.local"),
        help="Path to .env.local containing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    )
    parser.add_argument(
        "--prepare-only",
        action="store_true",
        help="Only encode the 8 looping animations locally without uploading to Supabase",
    )
    parser.add_argument(
        "--skip-encode",
        action="store_true",
        help="Upload already-encoded files from --output-dir without running ffmpeg again",
    )
    return parser.parse_args()


def _resolve_credentials(env_file: Path) -> tuple[str, str]:
    file_env = load_env_file(env_file)
    supabase_url = (
        os.environ.get("SUPABASE_URL")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        or file_env.get("SUPABASE_URL")
        or file_env.get("NEXT_PUBLIC_SUPABASE_URL")
        or ""
    ).strip()
    service_key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or file_env.get("SUPABASE_SERVICE_ROLE_KEY")
        or ""
    ).strip()
    return supabase_url, service_key


def main() -> int:
    args = parse_args()

    if args.skip_encode:
        demos = []
        for spec in WORD_DEMO_SPECS:
            object_name = f"{spec.word_id}.{args.format}"
            path = args.output_dir / object_name
            if not path.is_file():
                raise FileNotFoundError(f"Expected pre-encoded animation not found: {path}")
            demos.append(
                EncodedWordDemo(
                    word_id=spec.word_id,
                    title=spec.title,
                    output_path=path,
                    mime_type=FORMAT_MIME_TYPES[args.format],
                    object_name=object_name,
                )
            )
    else:
        demos = prepare_all_word_demos(args.raw_dir, args.output_dir, fmt=args.format)

    print(f"Prepared {len(demos)} looping {args.format.upper()} animations in {args.output_dir}:")
    for demo in demos:
        size_kb = demo.output_path.stat().st_size / 1024
        print(f"  - {demo.word_id:14s} -> {demo.output_path} ({size_kb:.1f} KB)")

    if args.prepare_only:
        return 0

    supabase_url, service_key = _resolve_credentials(args.env_file)
    if not supabase_url or not service_key:
        print(
            "Error: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY "
            "must be set in environment or --env-file to upload.",
            file=sys.stderr,
        )
        return 1

    rows = []
    for demo in demos:
        public_url = upload_file_to_supabase_storage(
            supabase_url=supabase_url,
            service_role_key=service_key,
            bucket=args.bucket,
            object_name=demo.object_name,
            file_path=demo.output_path,
            mime_type=demo.mime_type,
        )
        row = build_word_demo_row(demo, supabase_url, args.bucket)
        rows.append(row)
        print(f"Uploaded {demo.object_name} -> {public_url}")

    upsert_word_demo_rows(
        supabase_url=supabase_url,
        service_role_key=service_key,
        rows=rows,
        table=args.table,
    )
    print(f"Upserted {len(rows)} rows into public.{args.table}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
