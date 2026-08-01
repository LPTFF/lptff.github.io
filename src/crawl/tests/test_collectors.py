from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import Mock, patch

import pytz

from src.crawl.douban import poster_data_url, publish as publish_douban
from src.crawl.githubTrending import parse_trending
from src.crawl.infzm import parse_response as parse_infzm
from src.crawl.juejin import parse_response as parse_juejin
from src.crawl.kuaishou import parse_response as parse_kuaishou
from src.crawl.leetCode import normalize_legacy_item, publish_release, validate_existing_release
from src.crawl.meituanTech import parse_feed
from src.crawl.sendNotify import send_notification
from src.crawl.v2ex import parse_response as parse_v2ex
from src.crawl.weibo import parse_response as parse_weibo
from src.crawl.welfare import hxm5_request_body, parse_hxm5_response
from src.crawl.lib.welfare_sources import (
    parse_0818,
    parse_daydayzhuan,
    parse_daydayzhuan_top_candidates,
    parse_flexible_time,
    parse_zhuanyes_top_candidates,
)
from src.crawl.run_collectors import select_collectors
from src.crawl.tiktokData import collect as collect_tiktok
from src.crawl.zhipin import collect as collect_zhipin, is_challenge_page


class ParserTests(unittest.TestCase):
    def test_github_trending_parser_rejects_empty_structure(self):
        self.assertEqual(parse_trending("<html></html>"), [])
        items = parse_trending(
            '<article class="Box-row"><h2><a href="/owner/repo">owner / repo</a></h2>'
            '<p>A useful project</p></article>',
            datetime(2026, 8, 1),
        )
        self.assertEqual(items[0]["url"], "https://github.com/owner/repo")

    def test_meituan_rss_parser(self):
        items = parse_feed(
            "<rss><channel><item><title>Post</title><link>https://tech.meituan.com/post.html</link>"
            "<description>Desc</description><pubDate>Fri, 01 Aug 2025 00:00:00 +0800</pubDate>"
            "</item></channel></rss>"
        )
        self.assertEqual(items[0]["title"], "Post")

    def test_api_envelopes_are_required(self):
        for parser in (parse_juejin, parse_kuaishou, parse_v2ex, parse_weibo):
            with self.subTest(parser=parser.__module__):
                with self.assertRaises(ValueError):
                    parser({})

    def test_infzm_parser_builds_https_content_url(self):
        items = parse_infzm(
            {
                "data": {
                    "hot_contents": [
                        {
                            "id": 123,
                            "subject": "报道",
                            "publish_time": "2026-08-01 09:30:00",
                            "covers": [],
                        }
                    ]
                }
            }
        )
        self.assertEqual(items[0]["url"], "https://www.infzm.com/contents/123")

    def test_welfare_time_and_parser(self):
        now = pytz.timezone("Asia/Shanghai").localize(datetime(2026, 8, 1, 12))
        self.assertEqual(parse_flexible_time("08-01 09:30", now).hour, 9)
        items = parse_0818(
            '<div id="redtag"><a class="list-group-item" title="Deal" href="/deal">'
            '<span class="badge badge-success red">09:30</span></a></div>',
            top=False,
        )
        self.assertEqual(items[0]["link"], "https://www.0818tuan.com/deal")
    def test_daydayzhuan_does_not_invent_missing_timestamps(self):
        missing = (
            '<article class="layui-row title-li"><h2><a href="/deal" title="置顶内容">'
            '<i class="icon-zhiding"></i></a></h2></article>'
        )
        self.assertEqual(parse_daydayzhuan(missing, top=True), [])
        valid = (
            '<article class="layui-row title-li"><h2><a href="/deal" title="正常内容">'
            '正常内容</a></h2><time>08-01 09:30</time></article>'
        )
        self.assertEqual(parse_daydayzhuan(valid, top=False)[0]["title"], "正常内容")

    def test_hxm5_public_api_parser_and_guard(self):
        body = hxm5_request_body(1785544800)
        self.assertEqual(body["jt"], "9919693")
        self.assertTrue(body["jx"])
        items = parse_hxm5_response(
            {
                "code": 200,
                "data": {
                    "list": [
                        {
                            "ID": "123",
                            "Title": "公开线报",
                            "img": ["https://example.com/poster.jpg"],
                            "time": "2026-08-01 09:30",
                        }
                    ]
                },
            }
        )
        self.assertEqual(items[0]["link"], "https://www.hxm5.com/t/123")
        self.assertEqual(items[0]["website"], "hxm5")

    def test_top_candidates_do_not_invent_list_timestamps(self):
        daydayzhuan = parse_daydayzhuan_top_candidates(
            '<article class="layui-row title-li"><a href="/article/1" title="置顶内容">'
            '<i class="icon-zhiding"></i></a></article>'
        )
        zhuanyes = parse_zhuanyes_top_candidates(
            '<div class="pbm"><li><a href="https://www.zhuanyes.com/xianbao/1.html" '
            'title="热门内容">热门内容</a></li></div>'
        )
        self.assertNotIn("timestamp", daydayzhuan[0])
        self.assertNotIn("timestamp", zhuanyes[0])

    def test_weibo_requires_success_envelope(self):
        with self.assertRaises(ValueError):
            parse_weibo({"ok": 0, "data": {"realtime": []}})
        collected_at = pytz.timezone("Asia/Shanghai").localize(datetime(2026, 8, 1, 9, 30))
        items = parse_weibo(
            {
                "ok": 1,
                "data": {
                    "realtime": [
                        {
                            "note": "热搜",
                            "word": "热搜",
                        }
                    ]
                },
            },
            collected_at,
        )
        self.assertEqual(items[0]["timestamp"], int(collected_at.timestamp() * 1000))

    def test_zhipin_detects_security_redirect_without_broad_text_match(self):
        self.assertTrue(
            is_challenge_page(
                "https://www.zhipin.com/web/user/?fromUrl=https%3A%2F%2Fwww.zhipin.com%2Fweb%2Fgeek%2Fjobs%3F_security_check%3D1",
                "注册登录",
                "验证码登录/注册",
            )
        )
        self.assertFalse(
            is_challenge_page(
                "https://www.zhipin.com/web/geek/jobs",
                "职位列表",
                "岗位验证经验要求",
            )
        )

    def test_only_explicitly_selects_full_collector(self):
        selected = select_collectors(include_full=False, only=["tiktok"])
        self.assertEqual([spec.name for spec in selected], ["tiktok"])
        default = select_collectors(include_full=False, only=[])
        self.assertNotIn("tiktok", [spec.name for spec in default])


class ReleaseAndNotificationTests(unittest.TestCase):
    def leetcode_item(self, index: int):
        return {
            "problemsName": f" {index}.题目",
            "hardRate": "EASY",
            "passRate": "50.00%",
            "problemsUrl": f"https://leetcode.cn/problems/problem-{index}/",
            "solutionsUrl": f"https://leetcode.cn/problems/problem-{index}/solution",
            "problemsDesc": "<p>Description</p>",
            "isPlus": False,
        }

    def test_leetcode_release_is_complete_and_manifested(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "leetCode"
            result = publish_release([self.leetcode_item(1), self.leetcode_item(2)], target)
            self.assertEqual(result.state, "success")
            self.assertEqual(validate_existing_release(target), 2)
            manifest = json.loads((target / "manifest.json").read_text(encoding="utf-8"))
            self.assertEqual(manifest["chunks"], ["leetCode_1.json"])

    def test_legacy_leetcode_item_gets_nonempty_description_fallback(self):
        item = self.leetcode_item(1)
        item["problemsDesc"] = ""
        normalized = normalize_legacy_item(item)
        self.assertTrue(normalized["problemsDesc"])

    def movie(self, index: int):
        return {
            "url": f"https://movie.douban.com/subject/{index}/",
            "title": f"Movie {index}",
            "is_new": False,
            "rate": "8.0",
            "index": index,
            "cover": f"https://img1.doubanio.com/{index}.jpg",
            "id": str(index),
        }

    def test_douban_poster_preserves_verified_mime_type(self):
        self.assertEqual(
            poster_data_url(b"jpeg", "image/jpeg; charset=binary"),
            "data:image/jpeg;base64,anBlZw==",
        )
        with self.assertRaises(ValueError):
            poster_data_url(b"html", "text/html")

    @patch("src.crawl.douban.data_path")
    def test_douban_rejects_incomplete_poster_batch(self, data_path):
        with tempfile.TemporaryDirectory() as directory:
            data_path.side_effect = lambda value: Path(directory) / value
            with self.assertRaises(ValueError):
                publish_douban([self.movie(index) for index in range(10)], {})

    @patch("src.crawl.douban.data_path")
    def test_douban_publish_restores_posters_when_movie_replace_fails(self, data_path):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            movie = root / "movie.json"
            movie.write_text("old movie\n", encoding="utf-8")
            posters = root / "doubanImg"
            posters.mkdir()
            (posters / "old.json").write_text("old poster\n", encoding="utf-8")
            data_path.side_effect = lambda value: root / value
            original_replace = Path.replace

            def replace_with_failure(path, target):
                if Path(path).name == "movie.json":
                    raise OSError("simulated movie publish failure")
                return original_replace(path, target)

            poster_batch = {
                str(index): "data:image/jpeg;base64,anBlZw==" for index in range(10)
            }
            with patch.object(Path, "replace", autospec=True, side_effect=replace_with_failure):
                with self.assertRaises(OSError):
                    publish_douban([self.movie(index) for index in range(10)], poster_batch)
            self.assertTrue((posters / "old.json").exists())
            self.assertEqual(movie.read_text(encoding="utf-8"), "old movie\n")

    @patch("src.crawl.tiktokData.webdriver.Chrome")
    def test_tiktok_driver_quits_after_navigation_failure(self, chrome):
        driver = Mock()
        driver.get.side_effect = RuntimeError("navigation failed")
        chrome.return_value = driver
        with self.assertRaises(RuntimeError):
            collect_tiktok("redacted", max_scrolls=1, deadline_seconds=1)
        driver.quit.assert_called_once()

    @patch("src.crawl.zhipin.webdriver.Chrome")
    def test_zhipin_driver_quits_after_navigation_failure(self, chrome):
        driver = Mock()
        driver.get.side_effect = RuntimeError("navigation failed")
        chrome.return_value = driver
        with self.assertRaises(RuntimeError):
            collect_zhipin(max_pages=1, deadline_seconds=1)
        driver.quit.assert_called_once()

    @patch("src.crawl.sendNotify.requests.post")
    def test_notification_checks_provider_error_code(self, post):
        response = Mock()
        response.json.return_value = {"errcode": 40001}
        post.return_value = response
        with self.assertRaises(RuntimeError):
            send_notification("redacted", {"msgtype": "text"})
        self.assertNotIn("redacted", post.call_args.args[0])
        self.assertEqual(post.call_args.kwargs["params"], {"key": "redacted"})


if __name__ == "__main__":
    unittest.main()
