from __future__ import annotations

import base64
import json
import shutil
import sys
import tempfile
from pathlib import Path

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from crawl.lib.http import HttpClient
from crawl.lib.output import data_path
from crawl.lib.runner import preserve_or_fail
from crawl.lib.status import CollectorResult
from crawl.lib.validate import validate_items

NAME = "douban"
URL = "https://m.douban.com/rexxar/api/v2/subject/recent_hot/tv"
POSTERS_OUTPUT = "doubanPosters.json"
SUPPORTED_POSTER_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
POSTER_SIGNATURES = (b"\xff\xd8\xff", b"\x89PNG\r\n\x1a\n", b"RIFF", b"GIF8")


def poster_data_url(content: bytes, content_type: str) -> str:
    mime_type = content_type.split(";", 1)[0].strip().lower()
    if mime_type not in SUPPORTED_POSTER_TYPES:
        raise ValueError(f"Unsupported Douban poster type: {mime_type or 'missing'}")
    return f"data:{mime_type};base64,{base64.b64encode(content).decode('ascii')}"


def get_poster(client: HttpClient, cover: str) -> str:
    response = client.get(
        cover,
        expected_content_types=["image/"],
        headers={"Referer": "https://movie.douban.com/"},
    )
    if not response.content.startswith(POSTER_SIGNATURES):
        raise ValueError("Douban poster has an invalid image signature")
    return poster_data_url(response.content, response.headers.get("Content-Type", ""))


def collect() -> tuple[list[dict[str, object]], dict[str, str]]:
    client = HttpClient(
        allowed_hostnames=["m.douban.com", "img1.doubanio.com", "img2.doubanio.com", "img3.doubanio.com", "img9.doubanio.com"],
        max_bytes=5_000_000,
    )
    response = client.get(
        URL,
        params={"limit": 50, "category": "tv", "type": "tv_animation"},
        headers={"Referer": "https://movie.douban.com/"},
    )
    subjects = response.json().get("items")
    if not isinstance(subjects, list):
        raise ValueError("Douban response has no subjects array")
    movies: list[dict[str, object]] = []
    posters: dict[str, str] = {}
    for index, item in enumerate(subjects):
        if not isinstance(item, dict):
            continue
        movie_id = str(item.get("id") or "")
        title = str(item.get("title") or "")
        picture = item.get("pic") if isinstance(item.get("pic"), dict) else {}
        cover = str(picture.get("normal") or picture.get("large") or "")
        if not movie_id or not title or not cover:
            continue
        rating = item.get("rating") if isinstance(item.get("rating"), dict) else {}
        movies.append(
            {
                "url": f"https://movie.douban.com/subject/{movie_id}/",
                "title": title,
                "is_new": bool(item.get("is_new")),
                "rate": str(rating.get("value") or "暂无评分"),
                "episodes_info": str(item.get("episodes_info") or ""),
                "subtitle": str(item.get("card_subtitle") or ""),
                "category": "animation",
                "index": index,
                "cover": cover,
                "id": movie_id,
            }
        )
        try:
            posters[movie_id] = get_poster(client, cover)
        except Exception:
            continue
    return movies, posters


def publish(movies: list[dict[str, object]], posters: dict[str, str]) -> CollectorResult:
    validate_items(movies, kind="movie", min_items=10, require_unique="id")
    movie_ids = {str(movie["id"]) for movie in movies}
    if set(posters) != movie_ids:
        raise ValueError("Douban poster batch is incomplete")
    root = data_path("")
    staging = Path(tempfile.mkdtemp(prefix=".douban-", dir=root))
    try:
        (staging / "movie.json").write_text(
            json.dumps(movies, ensure_ascii=False, indent=4) + "\n", encoding="utf-8"
        )
        (staging / POSTERS_OUTPUT).write_text(
            json.dumps(posters, ensure_ascii=False, separators=(",", ":")) + "\n",
            encoding="utf-8",
        )
        targets = {
            "movie.json": data_path("movie.json"),
            POSTERS_OUTPUT: data_path(POSTERS_OUTPUT),
        }
        backups = {name: data_path(f".{name}.backup") for name in targets}
        for backup in backups.values():
            if backup.exists():
                backup.unlink()
        backed_up: list[str] = []
        published: list[str] = []
        try:
            for name, target in targets.items():
                if target.exists():
                    target.replace(backups[name])
                    backed_up.append(name)
            for name, target in targets.items():
                (staging / name).replace(target)
                published.append(name)
        except Exception:
            for name in published:
                targets[name].unlink(missing_ok=True)
            for name in reversed(backed_up):
                backups[name].replace(targets[name])
            raise
        for backup in backups.values():
            if backup.exists():
                backup.unlink()
        return CollectorResult(NAME, "success", len(movies), str(data_path("movie.json")))
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def main() -> int:
    try:
        result = publish(*collect())
    except Exception as error:
        result = preserve_or_fail(
            name=NAME,
            output="movie.json",
            kind="movie",
            min_items=10,
            reason=f"{type(error).__name__}: collector did not publish a complete movie snapshot",
        )
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0 if result.is_usable else 1


if __name__ == "__main__":
    raise SystemExit(main())
