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
from src.crawl.leetCode import (
    build_item,
    normalize_legacy_item,
    publish_release,
    validate_existing_release,
)
from src.crawl.meituanTech import parse_feed
from src.crawl.sendNotify import send_notification
from src.crawl.v2ex import collect as collect_v2ex, parse_response as parse_v2ex
from src.crawl.weibo import parse_response as parse_weibo
from src.crawl.welfare import hxm5_request_body, parse_hxm5_response
from src.crawl.lib.welfare_sources import (
    parse_0818_rss,
    run_0818_source,
    parse_daydayzhuan,
    parse_daydayzhuan_top_candidates,
    parse_flexible_time,
    parse_zhuanyes_top_candidates,
)
from src.crawl.run_collectors import is_fresh_candidate, select_collectors
from src.crawl.tiktokData import collect as collect_tiktok
from src.crawl.zhipin import parse_public_page as parse_zhipin_public_page


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

    def test_v2ex_parser_normalizes_and_orders_valid_topics(self):
        payload = [
            {
                "title": "Older",
                "url": "https://www.v2ex.com/t/100",
                "created": 1_754_006_400,
                "content": "Plain content",
                "member": {"avatar_normal": "//cdn.v2ex.com/avatar.png"},
            },
            {
                "title": "Newer",
                "url": "https://v2ex.com/t/101",
                "created": 1_754_010_000,
                "content_rendered": "<p>Rendered</p>",
                "member": {},
            },
            {
                "title": "Wrong host",
                "url": "https://example.com/t/102",
                "created": 1_754_020_000,
            },
        ]
        items = parse_v2ex(payload)
        self.assertEqual([item["title"] for item in items], ["Newer", "Older"])
        self.assertEqual(items[0]["time"], "2025-08-01 09:00:00")
        self.assertEqual(items[0]["desc"], "<p>Rendered</p>")
        self.assertEqual(items[1]["image"], "https://cdn.v2ex.com/avatar.png")

    @patch("src.crawl.v2ex.HttpClient")
    def test_v2ex_falls_back_after_invalid_envelope(self, http_client):
        responses = []
        for payload in ({"wrong": True}, [
            {"title": f"Topic {index}", "url": f"https://www.v2ex.com/t/{index}", "created": 1_754_006_400 + index}
            for index in range(1, 4)
        ]):
            response = Mock()
            response.json.return_value = payload
            responses.append(response)
        http_client.return_value.get.side_effect = responses
        items = collect_v2ex()
        self.assertEqual(len(items), 3)
        self.assertEqual(http_client.return_value.get.call_count, 2)

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

    def test_welfare_time_parser(self):
        now = pytz.timezone("Asia/Shanghai").localize(datetime(2026, 8, 1, 12))
        self.assertEqual(parse_flexible_time("08-01 09:30", now).hour, 9)

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

    def test_0818_rss_preserves_target_with_https_index_provenance(self):
        xml = """
        <rss><channel>
          <title>0818团 ‧ 最新线报活动</title>
          <link>https://tophub.today/n/4MdAkn1oxD</link>
          <generator>RSSHub</generator>
          <lastBuildDate>Sat, 01 Aug 2026 14:00:20 GMT</lastBuildDate>
          <item><title>当前线报</title>
            <guid>http://www.0818tuan.com/xbhd/2728343.html</guid>
          </item>
          <item><title>重复线报</title>
            <link>http://www.0818tuan.com/xbhd/2728343.html</link>
          </item>
          <item><title>错误来源</title>
            <guid>https://example.com/xbhd/1.html</guid>
          </item>
          <item><title>非活动入口</title>
            <guid>http://www.0818tuan.com/pdd/zudui.php</guid>
          </item>
        </channel></rss>
        """
        items = parse_0818_rss(xml)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["website"], "0818tuan")
        self.assertEqual(
            items[0]["link"],
            "https://tophub.today/n/4MdAkn1oxD?source=0818tuan&entry=2728343",
        )
        self.assertEqual(items[0]["time"], "2026-08-01 22:00:20")
        self.assertEqual(items[0]["timestampMeaning"], "source-index-updated-at")
        self.assertEqual(items[0]["sourceProvider"], "RSSHub / TopHub")
        self.assertNotIn("http://", json.dumps(items, ensure_ascii=False))

    def test_0818_rss_requires_exact_channel_identity(self):
        template = """
        <rss><channel><title>{title}</title><link>{link}</link>
          <generator>{generator}</generator>
          <lastBuildDate>Sat, 01 Aug 2026 14:00:20 GMT</lastBuildDate>
        </channel></rss>
        """
        invalid_channels = (
            ("其他来源", "https://tophub.today/n/4MdAkn1oxD", "RSSHub"),
            ("0818团 ‧ 最新线报活动", "https://example.com/node", "RSSHub"),
            ("0818团 ‧ 最新线报活动", "https://tophub.today/n/4MdAkn1oxD", "Other"),
        )
        for title, link, generator in invalid_channels:
            with self.subTest(title=title, link=link, generator=generator):
                with self.assertRaises(ValueError):
                    parse_0818_rss(
                        template.format(title=title, link=link, generator=generator)
                    )

    def test_0818_top_skip_does_not_delete_preserved_contract(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "0818tuanTop.json"
            original = '[{"title":"历史置顶合同"}]'
            output.write_text(original, encoding="utf-8")
            result = Mock(is_usable=True)
            result.to_dict.return_value = {"name": "0818tuanTop", "state": "skipped"}
            with patch(
                "src.crawl.lib.welfare_sources.preserve_or_fail",
                return_value=result,
            ) as preserve:
                self.assertEqual(
                    run_0818_source(name="0818tuanTop", output=str(output), top=True),
                    0,
                )
            self.assertEqual(output.read_text(encoding="utf-8"), original)
            preserve.assert_called_once_with(
                name="0818tuanTop",
                output=str(output),
                kind="welfare",
                reason="collector: no explicit HTTPS top-item evidence",
                min_items=1,
                optional=True,
                unique_by="link",
            )

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

    def test_zhipin_parses_public_city_page_roles(self):
        html = """
        <html><head><script type="application/ld+json">
        {"upDate": "2026-08-01T19:00:00"}
        </script></head><body>
          <div class="hot-company-wrapper"><ul><li>
            <a class="company-info-top"><div class="company-img">
              <img src="https://img.bosszhipin.com/logo.png" />
            </div><div class="company-info"><h3>示例科技</h3><p>已上市 互联网</p></div></a>
            <ul class="company-job-list"><li class="company-job-item">
              <a class="job-info" href="/job_detail/abc_123~.html?tracking=sensitive">
                <div class="job-info-top"><p class="name">前端开发工程师</p><p class="salary">20-30K</p></div>
                <p class="job-text"><span>南京</span><span>3-5年</span><span>本科</span></p>
              </a>
            </li></ul>
          </li></ul></div>
          <div class="hot-company-wrapper"><ul><li>
            <a class="company-info-top"><div class="company-info"><h3>后端公司</h3></div></a>
            <ul class="company-job-list"><li><a class="job-info" href="/job_detail/backend.html">
              <p class="name">后端开发工程师</p>
            </a></li></ul>
          </li></ul></div>
        </body></html>
        """
        jobs = parse_zhipin_public_page(
            html,
            source_url="https://www.zhipin.com/nanjing/",
        )
        self.assertEqual(len(jobs), 1)
        self.assertEqual(
            jobs[0]["job_detail"],
            "https://www.zhipin.com/job_detail/abc_123~.html",
        )
        self.assertEqual(jobs[0]["time"], "2026-08-01 19:00:00")
        self.assertEqual(jobs[0]["brandName"], "示例科技")
        self.assertEqual(jobs[0]["skills"], ["前端开发"])
        self.assertEqual(jobs[0]["website"], "zhipin")
        self.assertEqual(jobs[0]["sourcePage"], "/nanjing/")

    def test_zhipin_rejects_query_source_and_disallowed_detail_path(self):
        with self.assertRaises(ValueError):
            parse_zhipin_public_page(
                '<script type="application/ld+json">{"upDate":"2026-08-01T19:00:00"}</script>',
                source_url="https://www.zhipin.com/nanjing/?query=frontend",
            )
        html = """
        <script type="application/ld+json">{"upDate":"2026-08-01T19:00:00"}</script>
        <div><a class="company-info-top"><div class="company-info"><h3>示例科技</h3></div></a>
          <ul class="company-job-list"><li><a class="job-info" href="/job_detail/l123.html">
            <p class="name">前端开发工程师</p>
          </a></li></ul>
        </div>
        """
        self.assertEqual(
            parse_zhipin_public_page(html, source_url="https://www.zhipin.com/nanjing/"),
            [],
        )

    def test_fresh_candidate_requires_newer_timestamped_content(self):
        self.assertTrue(
            is_fresh_candidate(
                state="success",
                changed=True,
                kind="article",
                new_item_count=1,
                timestamp_advanced=True,
            )
        )
        self.assertFalse(
            is_fresh_candidate(
                state="success",
                changed=True,
                kind="article",
                new_item_count=1,
                timestamp_advanced=False,
            )
        )
        self.assertFalse(
            is_fresh_candidate(
                state="preserved",
                changed=False,
                kind="article",
                new_item_count=0,
                timestamp_advanced=False,
            )
        )

        self.assertTrue(
            is_fresh_candidate(
                state="success",
                changed=True,
                kind="job",
                new_item_count=3,
                timestamp_advanced=True,
            )
        )
        self.assertFalse(
            is_fresh_candidate(
                state="success",
                changed=True,
                kind="job",
                new_item_count=3,
                timestamp_advanced=False,
            )
        )
        self.assertFalse(
            is_fresh_candidate(
                state="success",
                changed=True,
                kind="job",
                new_item_count=0,
                timestamp_advanced=False,
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

    def test_leetcode_uses_default_title_when_translation_is_missing(self):
        item = build_item(
            4005,
            {
                "titleCn": "",
                "title": "Minimum Operations to Make Array Equal III",
                "titleSlug": "minimum-operations-to-make-array-equal-iii",
                "acRate": 50,
                "difficulty": "HARD",
                "paidOnly": False,
            },
            "<p>Description</p>",
        )
        self.assertEqual(item["problemsName"], " 4005.Minimum Operations to Make Array Equal III")

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
