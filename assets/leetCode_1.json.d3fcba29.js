const n=[{problemsName:" 1.\u4E24\u6570\u4E4B\u548C",hardRate:"EASY",passRate:"52.93%",problemsUrl:"https://leetcode.cn/problems/two-sum/",solutionsUrl:"https://leetcode.cn/problems/two-sum/solution",problemsDesc:`<p>\u7ED9\u5B9A\u4E00\u4E2A\u6574\u6570\u6570\u7EC4 <code>nums</code>&nbsp;\u548C\u4E00\u4E2A\u6574\u6570\u76EE\u6807\u503C <code>target</code>\uFF0C\u8BF7\u4F60\u5728\u8BE5\u6570\u7EC4\u4E2D\u627E\u51FA <strong>\u548C\u4E3A\u76EE\u6807\u503C </strong><em><code>target</code></em>&nbsp; \u7684\u90A3&nbsp;<strong>\u4E24\u4E2A</strong>&nbsp;\u6574\u6570\uFF0C\u5E76\u8FD4\u56DE\u5B83\u4EEC\u7684\u6570\u7EC4\u4E0B\u6807\u3002</p>

<p>\u4F60\u53EF\u4EE5\u5047\u8BBE\u6BCF\u79CD\u8F93\u5165\u53EA\u4F1A\u5BF9\u5E94\u4E00\u4E2A\u7B54\u6848\u3002\u4F46\u662F\uFF0C\u6570\u7EC4\u4E2D\u540C\u4E00\u4E2A\u5143\u7D20\u5728\u7B54\u6848\u91CC\u4E0D\u80FD\u91CD\u590D\u51FA\u73B0\u3002</p>

<p>\u4F60\u53EF\u4EE5\u6309\u4EFB\u610F\u987A\u5E8F\u8FD4\u56DE\u7B54\u6848\u3002</p>

<p>&nbsp;</p>

<p><strong class="example">\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [2,7,11,15], target = 9
<strong>\u8F93\u51FA\uFF1A</strong>[0,1]
<strong>\u89E3\u91CA\uFF1A</strong>\u56E0\u4E3A nums[0] + nums[1] == 9 \uFF0C\u8FD4\u56DE [0, 1] \u3002
</pre>

<p><strong class="example">\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [3,2,4], target = 6
<strong>\u8F93\u51FA\uFF1A</strong>[1,2]
</pre>

<p><strong class="example">\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [3,3], target = 6
<strong>\u8F93\u51FA\uFF1A</strong>[0,1]
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>2 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
	<li><code>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></code></li>
	<li><code>-10<sup>9</sup> &lt;= target &lt;= 10<sup>9</sup></code></li>
	<li><strong>\u53EA\u4F1A\u5B58\u5728\u4E00\u4E2A\u6709\u6548\u7B54\u6848</strong></li>
</ul>

<p>&nbsp;</p>

<p><strong>\u8FDB\u9636\uFF1A</strong>\u4F60\u53EF\u4EE5\u60F3\u51FA\u4E00\u4E2A\u65F6\u95F4\u590D\u6742\u5EA6\u5C0F\u4E8E <code>O(n<sup>2</sup>)</code> \u7684\u7B97\u6CD5\u5417\uFF1F</p>
`,isPlus:!1},{problemsName:" 2.\u4E24\u6570\u76F8\u52A0",hardRate:"MEDIUM",passRate:"42.57%",problemsUrl:"https://leetcode.cn/problems/add-two-numbers/",solutionsUrl:"https://leetcode.cn/problems/add-two-numbers/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E24\u4E2A\xA0<strong>\u975E\u7A7A</strong> \u7684\u94FE\u8868\uFF0C\u8868\u793A\u4E24\u4E2A\u975E\u8D1F\u7684\u6574\u6570\u3002\u5B83\u4EEC\u6BCF\u4F4D\u6570\u5B57\u90FD\u662F\u6309\u7167\xA0<strong>\u9006\u5E8F</strong>\xA0\u7684\u65B9\u5F0F\u5B58\u50A8\u7684\uFF0C\u5E76\u4E14\u6BCF\u4E2A\u8282\u70B9\u53EA\u80FD\u5B58\u50A8\xA0<strong>\u4E00\u4F4D</strong>\xA0\u6570\u5B57\u3002</p>

<p>\u8BF7\u4F60\u5C06\u4E24\u4E2A\u6570\u76F8\u52A0\uFF0C\u5E76\u4EE5\u76F8\u540C\u5F62\u5F0F\u8FD4\u56DE\u4E00\u4E2A\u8868\u793A\u548C\u7684\u94FE\u8868\u3002</p>

<p>\u4F60\u53EF\u4EE5\u5047\u8BBE\u9664\u4E86\u6570\u5B57 0 \u4E4B\u5916\uFF0C\u8FD9\u4E24\u4E2A\u6570\u90FD\u4E0D\u4F1A\u4EE5 0\xA0\u5F00\u5934\u3002</p>

<p>\xA0</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>
<img alt="" src="https://assets.leetcode-cn.com/aliyun-lc-upload/uploads/2021/01/02/addtwonumber1.jpg" style="width: 483px; height: 342px;" />
<pre>
<strong>\u8F93\u5165\uFF1A</strong>l1 = [2,4,3], l2 = [5,6,4]
<strong>\u8F93\u51FA\uFF1A</strong>[7,0,8]
<strong>\u89E3\u91CA\uFF1A</strong>342 + 465 = 807.
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>l1 = [0], l2 = [0]
<strong>\u8F93\u51FA\uFF1A</strong>[0]
</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]
<strong>\u8F93\u51FA\uFF1A</strong>[8,9,9,9,0,0,0,1]
</pre>

<p>\xA0</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li>\u6BCF\u4E2A\u94FE\u8868\u4E2D\u7684\u8282\u70B9\u6570\u5728\u8303\u56F4 <code>[1, 100]</code> \u5185</li>
	<li><code>0 <= Node.val <= 9</code></li>
	<li>\u9898\u76EE\u6570\u636E\u4FDD\u8BC1\u5217\u8868\u8868\u793A\u7684\u6570\u5B57\u4E0D\u542B\u524D\u5BFC\u96F6</li>
</ul>
`,isPlus:!1},{problemsName:" 3.\u65E0\u91CD\u590D\u5B57\u7B26\u7684\u6700\u957F\u5B50\u4E32",hardRate:"MEDIUM",passRate:"39.12%",problemsUrl:"https://leetcode.cn/problems/longest-substring-without-repeating-characters/",solutionsUrl:"https://leetcode.cn/problems/longest-substring-without-repeating-characters/solution",problemsDesc:`<p>\u7ED9\u5B9A\u4E00\u4E2A\u5B57\u7B26\u4E32 <code>s</code> \uFF0C\u8BF7\u4F60\u627E\u51FA\u5176\u4E2D\u4E0D\u542B\u6709\u91CD\u590D\u5B57\u7B26\u7684&nbsp;<strong>\u6700\u957F\u5B50\u4E32&nbsp;</strong>\u7684\u957F\u5EA6\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B&nbsp;1:</strong></p>

<pre>
<strong>\u8F93\u5165: </strong>s = "abcabcbb"
<strong>\u8F93\u51FA: </strong>3 
<strong>\u89E3\u91CA:</strong> \u56E0\u4E3A\u65E0\u91CD\u590D\u5B57\u7B26\u7684\u6700\u957F\u5B50\u4E32\u662F <code>"abc"\uFF0C\u6240\u4EE5\u5176</code>\u957F\u5EA6\u4E3A 3\u3002
</pre>

<p><strong>\u793A\u4F8B 2:</strong></p>

<pre>
<strong>\u8F93\u5165: </strong>s = "bbbbb"
<strong>\u8F93\u51FA: </strong>1
<strong>\u89E3\u91CA: </strong>\u56E0\u4E3A\u65E0\u91CD\u590D\u5B57\u7B26\u7684\u6700\u957F\u5B50\u4E32\u662F <code>"b"</code>\uFF0C\u6240\u4EE5\u5176\u957F\u5EA6\u4E3A 1\u3002
</pre>

<p><strong>\u793A\u4F8B 3:</strong></p>

<pre>
<strong>\u8F93\u5165: </strong>s = "pwwkew"
<strong>\u8F93\u51FA: </strong>3
<strong>\u89E3\u91CA: </strong>\u56E0\u4E3A\u65E0\u91CD\u590D\u5B57\u7B26\u7684\u6700\u957F\u5B50\u4E32\u662F&nbsp;<code>"wke"</code>\uFF0C\u6240\u4EE5\u5176\u957F\u5EA6\u4E3A 3\u3002
&nbsp;    \u8BF7\u6CE8\u610F\uFF0C\u4F60\u7684\u7B54\u6848\u5FC5\u987B\u662F <strong>\u5B50\u4E32 </strong>\u7684\u957F\u5EA6\uFF0C<code>"pwke"</code>&nbsp;\u662F\u4E00\u4E2A<em>\u5B50\u5E8F\u5217\uFF0C</em>\u4E0D\u662F\u5B50\u4E32\u3002
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>0 &lt;= s.length &lt;= 5 * 10<sup>4</sup></code></li>
	<li><code>s</code>&nbsp;\u7531\u82F1\u6587\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u7B26\u53F7\u548C\u7A7A\u683C\u7EC4\u6210</li>
</ul>
`,isPlus:!1},{problemsName:" 4.\u5BFB\u627E\u4E24\u4E2A\u6B63\u5E8F\u6570\u7EC4\u7684\u4E2D\u4F4D\u6570",hardRate:"HARD",passRate:"41.52%",problemsUrl:"https://leetcode.cn/problems/median-of-two-sorted-arrays/",solutionsUrl:"https://leetcode.cn/problems/median-of-two-sorted-arrays/solution",problemsDesc:`<p>\u7ED9\u5B9A\u4E24\u4E2A\u5927\u5C0F\u5206\u522B\u4E3A <code>m</code> \u548C <code>n</code> \u7684\u6B63\u5E8F\uFF08\u4ECE\u5C0F\u5230\u5927\uFF09\u6570\u7EC4&nbsp;<code>nums1</code> \u548C&nbsp;<code>nums2</code>\u3002\u8BF7\u4F60\u627E\u51FA\u5E76\u8FD4\u56DE\u8FD9\u4E24\u4E2A\u6B63\u5E8F\u6570\u7EC4\u7684 <strong>\u4E2D\u4F4D\u6570</strong> \u3002</p>

<p>\u7B97\u6CD5\u7684\u65F6\u95F4\u590D\u6742\u5EA6\u5E94\u8BE5\u4E3A <code>O(log (m+n))</code> \u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums1 = [1,3], nums2 = [2]
<strong>\u8F93\u51FA\uFF1A</strong>2.00000
<strong>\u89E3\u91CA\uFF1A</strong>\u5408\u5E76\u6570\u7EC4 = [1,2,3] \uFF0C\u4E2D\u4F4D\u6570 2
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums1 = [1,2], nums2 = [3,4]
<strong>\u8F93\u51FA\uFF1A</strong>2.50000
<strong>\u89E3\u91CA\uFF1A</strong>\u5408\u5E76\u6570\u7EC4 = [1,2,3,4] \uFF0C\u4E2D\u4F4D\u6570 (2 + 3) / 2 = 2.5
</pre>

<p>&nbsp;</p>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>nums1.length == m</code></li>
	<li><code>nums2.length == n</code></li>
	<li><code>0 &lt;= m &lt;= 1000</code></li>
	<li><code>0 &lt;= n &lt;= 1000</code></li>
	<li><code>1 &lt;= m + n &lt;= 2000</code></li>
	<li><code>-10<sup>6</sup> &lt;= nums1[i], nums2[i] &lt;= 10<sup>6</sup></code></li>
</ul>
`,isPlus:!1},{problemsName:" 5.\u6700\u957F\u56DE\u6587\u5B50\u4E32",hardRate:"MEDIUM",passRate:"37.63%",problemsUrl:"https://leetcode.cn/problems/longest-palindromic-substring/",solutionsUrl:"https://leetcode.cn/problems/longest-palindromic-substring/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A\u5B57\u7B26\u4E32 <code>s</code>\uFF0C\u627E\u5230 <code>s</code> \u4E2D\u6700\u957F\u7684\u56DE\u6587\u5B50\u4E32\u3002</p>

<p>\u5982\u679C\u5B57\u7B26\u4E32\u7684\u53CD\u5E8F\u4E0E\u539F\u59CB\u5B57\u7B26\u4E32\u76F8\u540C\uFF0C\u5219\u8BE5\u5B57\u7B26\u4E32\u79F0\u4E3A\u56DE\u6587\u5B57\u7B26\u4E32\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "babad"
<strong>\u8F93\u51FA\uFF1A</strong>"bab"
<strong>\u89E3\u91CA\uFF1A</strong>"aba" \u540C\u6837\u662F\u7B26\u5408\u9898\u610F\u7684\u7B54\u6848\u3002
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "cbbd"
<strong>\u8F93\u51FA\uFF1A</strong>"bb"
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= s.length &lt;= 1000</code></li>
	<li><code>s</code> \u4EC5\u7531\u6570\u5B57\u548C\u82F1\u6587\u5B57\u6BCD\u7EC4\u6210</li>
</ul>
`,isPlus:!1},{problemsName:" 6.N \u5B57\u5F62\u53D8\u6362",hardRate:"MEDIUM",passRate:"52.05%",problemsUrl:"https://leetcode.cn/problems/zigzag-conversion/",solutionsUrl:"https://leetcode.cn/problems/zigzag-conversion/solution",problemsDesc:`<p>\u5C06\u4E00\u4E2A\u7ED9\u5B9A\u5B57\u7B26\u4E32 <code>s</code> \u6839\u636E\u7ED9\u5B9A\u7684\u884C\u6570 <code>numRows</code> \uFF0C\u4EE5\u4ECE\u4E0A\u5F80\u4E0B\u3001\u4ECE\u5DE6\u5230\u53F3\u8FDB\u884C\xA0Z \u5B57\u5F62\u6392\u5217\u3002</p>

<p>\u6BD4\u5982\u8F93\u5165\u5B57\u7B26\u4E32\u4E3A <code>"PAYPALISHIRING"</code>\xA0\u884C\u6570\u4E3A <code>3</code> \u65F6\uFF0C\u6392\u5217\u5982\u4E0B\uFF1A</p>

<pre>
P   A   H   N
A P L S I I G
Y   I   R</pre>

<p>\u4E4B\u540E\uFF0C\u4F60\u7684\u8F93\u51FA\u9700\u8981\u4ECE\u5DE6\u5F80\u53F3\u9010\u884C\u8BFB\u53D6\uFF0C\u4EA7\u751F\u51FA\u4E00\u4E2A\u65B0\u7684\u5B57\u7B26\u4E32\uFF0C\u6BD4\u5982\uFF1A<code>"PAHNAPLSIIGYIR"</code>\u3002</p>

<p>\u8BF7\u4F60\u5B9E\u73B0\u8FD9\u4E2A\u5C06\u5B57\u7B26\u4E32\u8FDB\u884C\u6307\u5B9A\u884C\u6570\u53D8\u6362\u7684\u51FD\u6570\uFF1A</p>

<pre>
string convert(string s, int numRows);</pre>

<p>\xA0</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "PAYPALISHIRING", numRows = 3
<strong>\u8F93\u51FA\uFF1A</strong>"PAHNAPLSIIGYIR"
</pre>
<strong>\u793A\u4F8B 2\uFF1A</strong>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "PAYPALISHIRING", numRows = 4
<strong>\u8F93\u51FA\uFF1A</strong>"PINALSIGYAHRPI"
<strong>\u89E3\u91CA\uFF1A</strong>
P     I    N
A   L S  I G
Y A   H R
P     I
</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "A", numRows = 1
<strong>\u8F93\u51FA\uFF1A</strong>"A"
</pre>

<p>\xA0</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 <= s.length <= 1000</code></li>
	<li><code>s</code> \u7531\u82F1\u6587\u5B57\u6BCD\uFF08\u5C0F\u5199\u548C\u5927\u5199\uFF09\u3001<code>','</code> \u548C <code>'.'</code> \u7EC4\u6210</li>
	<li><code>1 <= numRows <= 1000</code></li>
</ul>
`,isPlus:!1},{problemsName:" 7.\u6574\u6570\u53CD\u8F6C",hardRate:"MEDIUM",passRate:"35.38%",problemsUrl:"https://leetcode.cn/problems/reverse-integer/",solutionsUrl:"https://leetcode.cn/problems/reverse-integer/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A 32 \u4F4D\u7684\u6709\u7B26\u53F7\u6574\u6570 <code>x</code> \uFF0C\u8FD4\u56DE\u5C06 <code>x</code> \u4E2D\u7684\u6570\u5B57\u90E8\u5206\u53CD\u8F6C\u540E\u7684\u7ED3\u679C\u3002</p>

<p>\u5982\u679C\u53CD\u8F6C\u540E\u6574\u6570\u8D85\u8FC7 32 \u4F4D\u7684\u6709\u7B26\u53F7\u6574\u6570\u7684\u8303\u56F4\xA0<code>[\u22122<sup>31</sup>,\xA0 2<sup>31\xA0</sup>\u2212 1]</code> \uFF0C\u5C31\u8FD4\u56DE 0\u3002</p>
<strong>\u5047\u8BBE\u73AF\u5883\u4E0D\u5141\u8BB8\u5B58\u50A8 64 \u4F4D\u6574\u6570\uFF08\u6709\u7B26\u53F7\u6216\u65E0\u7B26\u53F7\uFF09\u3002</strong>

<p>\xA0</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>x = 123
<strong>\u8F93\u51FA\uFF1A</strong>321
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>x = -123
<strong>\u8F93\u51FA\uFF1A</strong>-321
</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>x = 120
<strong>\u8F93\u51FA\uFF1A</strong>21
</pre>

<p><strong>\u793A\u4F8B 4\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>x = 0
<strong>\u8F93\u51FA\uFF1A</strong>0
</pre>

<p>\xA0</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>-2<sup>31</sup> <= x <= 2<sup>31</sup> - 1</code></li>
</ul>
`,isPlus:!1},{problemsName:" 8.\u5B57\u7B26\u4E32\u8F6C\u6362\u6574\u6570 (atoi)",hardRate:"MEDIUM",passRate:"21.24%",problemsUrl:"https://leetcode.cn/problems/string-to-integer-atoi/",solutionsUrl:"https://leetcode.cn/problems/string-to-integer-atoi/solution",problemsDesc:`<p>\u8BF7\u4F60\u6765\u5B9E\u73B0\u4E00\u4E2A&nbsp;<code>myAtoi(string s)</code>&nbsp;\u51FD\u6570\uFF0C\u4F7F\u5176\u80FD\u5C06\u5B57\u7B26\u4E32\u8F6C\u6362\u6210\u4E00\u4E2A 32 \u4F4D\u6709\u7B26\u53F7\u6574\u6570\uFF08\u7C7B\u4F3C C/C++ \u4E2D\u7684 <code>atoi</code> \u51FD\u6570\uFF09\u3002</p>

<p>\u51FD\u6570&nbsp;<code>myAtoi(string s)</code> \u7684\u7B97\u6CD5\u5982\u4E0B\uFF1A</p>

<ol>
	<li>\u8BFB\u5165\u5B57\u7B26\u4E32\u5E76\u4E22\u5F03\u65E0\u7528\u7684\u524D\u5BFC\u7A7A\u683C</li>
	<li>\u68C0\u67E5\u4E0B\u4E00\u4E2A\u5B57\u7B26\uFF08\u5047\u8BBE\u8FD8\u672A\u5230\u5B57\u7B26\u672B\u5C3E\uFF09\u4E3A\u6B63\u8FD8\u662F\u8D1F\u53F7\uFF0C\u8BFB\u53D6\u8BE5\u5B57\u7B26\uFF08\u5982\u679C\u6709\uFF09\u3002 \u786E\u5B9A\u6700\u7EC8\u7ED3\u679C\u662F\u8D1F\u6570\u8FD8\u662F\u6B63\u6570\u3002 \u5982\u679C\u4E24\u8005\u90FD\u4E0D\u5B58\u5728\uFF0C\u5219\u5047\u5B9A\u7ED3\u679C\u4E3A\u6B63\u3002</li>
	<li>\u8BFB\u5165\u4E0B\u4E00\u4E2A\u5B57\u7B26\uFF0C\u76F4\u5230\u5230\u8FBE\u4E0B\u4E00\u4E2A\u975E\u6570\u5B57\u5B57\u7B26\u6216\u5230\u8FBE\u8F93\u5165\u7684\u7ED3\u5C3E\u3002\u5B57\u7B26\u4E32\u7684\u5176\u4F59\u90E8\u5206\u5C06\u88AB\u5FFD\u7565\u3002</li>
	<li>\u5C06\u524D\u9762\u6B65\u9AA4\u8BFB\u5165\u7684\u8FD9\u4E9B\u6570\u5B57\u8F6C\u6362\u4E3A\u6574\u6570\uFF08\u5373\uFF0C"123" -&gt; 123\uFF0C "0032" -&gt; 32\uFF09\u3002\u5982\u679C\u6CA1\u6709\u8BFB\u5165\u6570\u5B57\uFF0C\u5219\u6574\u6570\u4E3A <code>0</code> \u3002\u5FC5\u8981\u65F6\u66F4\u6539\u7B26\u53F7\uFF08\u4ECE\u6B65\u9AA4 2 \u5F00\u59CB\uFF09\u3002</li>
	<li>\u5982\u679C\u6574\u6570\u6570\u8D85\u8FC7 32 \u4F4D\u6709\u7B26\u53F7\u6574\u6570\u8303\u56F4 <code>[\u22122<sup>31</sup>,&nbsp; 2<sup>31&nbsp;</sup>\u2212 1]</code> \uFF0C\u9700\u8981\u622A\u65AD\u8FD9\u4E2A\u6574\u6570\uFF0C\u4F7F\u5176\u4FDD\u6301\u5728\u8FD9\u4E2A\u8303\u56F4\u5185\u3002\u5177\u4F53\u6765\u8BF4\uFF0C\u5C0F\u4E8E <code>\u22122<sup>31</sup></code> \u7684\u6574\u6570\u5E94\u8BE5\u88AB\u56FA\u5B9A\u4E3A <code>\u22122<sup>31</sup></code> \uFF0C\u5927\u4E8E <code>2<sup>31&nbsp;</sup>\u2212 1</code> \u7684\u6574\u6570\u5E94\u8BE5\u88AB\u56FA\u5B9A\u4E3A <code>2<sup>31&nbsp;</sup>\u2212 1</code> \u3002</li>
	<li>\u8FD4\u56DE\u6574\u6570\u4F5C\u4E3A\u6700\u7EC8\u7ED3\u679C\u3002</li>
</ol>

<p><strong>\u6CE8\u610F\uFF1A</strong></p>

<ul>
	<li>\u672C\u9898\u4E2D\u7684\u7A7A\u767D\u5B57\u7B26\u53EA\u5305\u62EC\u7A7A\u683C\u5B57\u7B26 <code>' '</code> \u3002</li>
	<li>\u9664\u524D\u5BFC\u7A7A\u683C\u6216\u6570\u5B57\u540E\u7684\u5176\u4F59\u5B57\u7B26\u4E32\u5916\uFF0C<strong>\u8BF7\u52FF\u5FFD\u7565</strong> \u4EFB\u4F55\u5176\u4ED6\u5B57\u7B26\u3002</li>
</ul>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B&nbsp;1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "42"
<strong>\u8F93\u51FA\uFF1A</strong>42
<strong>\u89E3\u91CA\uFF1A</strong>\u52A0\u7C97\u7684\u5B57\u7B26\u4E32\u4E3A\u5DF2\u7ECF\u8BFB\u5165\u7684\u5B57\u7B26\uFF0C\u63D2\u5165\u7B26\u53F7\u662F\u5F53\u524D\u8BFB\u53D6\u7684\u5B57\u7B26\u3002
\u7B2C 1 \u6B65\uFF1A"42"\uFF08\u5F53\u524D\u6CA1\u6709\u8BFB\u5165\u5B57\u7B26\uFF0C\u56E0\u4E3A\u6CA1\u6709\u524D\u5BFC\u7A7A\u683C\uFF09
         ^
\u7B2C 2 \u6B65\uFF1A"42"\uFF08\u5F53\u524D\u6CA1\u6709\u8BFB\u5165\u5B57\u7B26\uFF0C\u56E0\u4E3A\u8FD9\u91CC\u4E0D\u5B58\u5728 '-' \u6216\u8005 '+'\uFF09
         ^
\u7B2C 3 \u6B65\uFF1A"<u>42</u>"\uFF08\u8BFB\u5165 "42"\uFF09
           ^
\u89E3\u6790\u5F97\u5230\u6574\u6570 42 \u3002
\u7531\u4E8E "42" \u5728\u8303\u56F4 [-2<sup>31</sup>, 2<sup>31</sup> - 1] \u5185\uFF0C\u6700\u7EC8\u7ED3\u679C\u4E3A 42 \u3002</pre>

<p><strong>\u793A\u4F8B&nbsp;2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "   -42"
<strong>\u8F93\u51FA\uFF1A</strong>-42
<strong>\u89E3\u91CA\uFF1A</strong>
\u7B2C 1 \u6B65\uFF1A"<u><strong>   </strong></u>-42"\uFF08\u8BFB\u5165\u524D\u5BFC\u7A7A\u683C\uFF0C\u4F46\u5FFD\u89C6\u6389\uFF09
            ^
\u7B2C 2 \u6B65\uFF1A"   <u><strong>-</strong></u>42"\uFF08\u8BFB\u5165 '-' \u5B57\u7B26\uFF0C\u6240\u4EE5\u7ED3\u679C\u5E94\u8BE5\u662F\u8D1F\u6570\uFF09
             ^
\u7B2C 3 \u6B65\uFF1A"   <u><strong>-42</strong></u>"\uFF08\u8BFB\u5165 "42"\uFF09
               ^
\u89E3\u6790\u5F97\u5230\u6574\u6570 -42 \u3002
\u7531\u4E8E "-42" \u5728\u8303\u56F4 [-2<sup>31</sup>, 2<sup>31</sup> - 1] \u5185\uFF0C\u6700\u7EC8\u7ED3\u679C\u4E3A -42 \u3002
</pre>

<p><strong>\u793A\u4F8B&nbsp;3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "4193 with words"
<strong>\u8F93\u51FA\uFF1A</strong>4193
<strong>\u89E3\u91CA\uFF1A</strong>
\u7B2C 1 \u6B65\uFF1A"4193 with words"\uFF08\u5F53\u524D\u6CA1\u6709\u8BFB\u5165\u5B57\u7B26\uFF0C\u56E0\u4E3A\u6CA1\u6709\u524D\u5BFC\u7A7A\u683C\uFF09
         ^
\u7B2C 2 \u6B65\uFF1A"4193 with words"\uFF08\u5F53\u524D\u6CA1\u6709\u8BFB\u5165\u5B57\u7B26\uFF0C\u56E0\u4E3A\u8FD9\u91CC\u4E0D\u5B58\u5728 '-' \u6216\u8005 '+'\uFF09
         ^
\u7B2C 3 \u6B65\uFF1A"<u>4193</u> with words"\uFF08\u8BFB\u5165 "4193"\uFF1B\u7531\u4E8E\u4E0B\u4E00\u4E2A\u5B57\u7B26\u4E0D\u662F\u4E00\u4E2A\u6570\u5B57\uFF0C\u6240\u4EE5\u8BFB\u5165\u505C\u6B62\uFF09
             ^
\u89E3\u6790\u5F97\u5230\u6574\u6570 4193 \u3002
\u7531\u4E8E "4193" \u5728\u8303\u56F4 [-2<sup>31</sup>, 2<sup>31</sup> - 1] \u5185\uFF0C\u6700\u7EC8\u7ED3\u679C\u4E3A 4193 \u3002
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>0 &lt;= s.length &lt;= 200</code></li>
	<li><code>s</code> \u7531\u82F1\u6587\u5B57\u6BCD\uFF08\u5927\u5199\u548C\u5C0F\u5199\uFF09\u3001\u6570\u5B57\uFF08<code>0-9</code>\uFF09\u3001<code>' '</code>\u3001<code>'+'</code>\u3001<code>'-'</code> \u548C <code>'.'</code> \u7EC4\u6210</li>
</ul>
`,isPlus:!1},{problemsName:" 9.\u56DE\u6587\u6570",hardRate:"EASY",passRate:"55.94%",problemsUrl:"https://leetcode.cn/problems/palindrome-number/",solutionsUrl:"https://leetcode.cn/problems/palindrome-number/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A\u6574\u6570 <code>x</code> \uFF0C\u5982\u679C <code>x</code> \u662F\u4E00\u4E2A\u56DE\u6587\u6574\u6570\uFF0C\u8FD4\u56DE <code>true</code> \uFF1B\u5426\u5219\uFF0C\u8FD4\u56DE <code>false</code> \u3002</p>

<p>\u56DE\u6587\u6570\u662F\u6307\u6B63\u5E8F\uFF08\u4ECE\u5DE6\u5411\u53F3\uFF09\u548C\u5012\u5E8F\uFF08\u4ECE\u53F3\u5411\u5DE6\uFF09\u8BFB\u90FD\u662F\u4E00\u6837\u7684\u6574\u6570\u3002</p>

<ul>
	<li>\u4F8B\u5982\uFF0C<code>121</code> \u662F\u56DE\u6587\uFF0C\u800C <code>123</code> \u4E0D\u662F\u3002</li>
</ul>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>x = 121
<strong>\u8F93\u51FA\uFF1A</strong>true
</pre>

<p><strong>\u793A\u4F8B&nbsp;2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>x = -121
<strong>\u8F93\u51FA\uFF1A</strong>false
<strong>\u89E3\u91CA\uFF1A</strong>\u4ECE\u5DE6\u5411\u53F3\u8BFB, \u4E3A -121 \u3002 \u4ECE\u53F3\u5411\u5DE6\u8BFB, \u4E3A 121- \u3002\u56E0\u6B64\u5B83\u4E0D\u662F\u4E00\u4E2A\u56DE\u6587\u6570\u3002
</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>x = 10
<strong>\u8F93\u51FA\uFF1A</strong>false
<strong>\u89E3\u91CA\uFF1A</strong>\u4ECE\u53F3\u5411\u5DE6\u8BFB, \u4E3A 01 \u3002\u56E0\u6B64\u5B83\u4E0D\u662F\u4E00\u4E2A\u56DE\u6587\u6570\u3002
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>-2<sup>31</sup>&nbsp;&lt;= x &lt;= 2<sup>31</sup>&nbsp;- 1</code></li>
</ul>

<p>&nbsp;</p>

<p><strong>\u8FDB\u9636\uFF1A</strong>\u4F60\u80FD\u4E0D\u5C06\u6574\u6570\u8F6C\u4E3A\u5B57\u7B26\u4E32\u6765\u89E3\u51B3\u8FD9\u4E2A\u95EE\u9898\u5417\uFF1F</p>
`,isPlus:!1},{problemsName:" 10.\u6B63\u5219\u8868\u8FBE\u5F0F\u5339\u914D",hardRate:"HARD",passRate:"30.74%",problemsUrl:"https://leetcode.cn/problems/regular-expression-matching/",solutionsUrl:"https://leetcode.cn/problems/regular-expression-matching/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A\u5B57\u7B26\u4E32&nbsp;<code>s</code>&nbsp;\u548C\u4E00\u4E2A\u5B57\u7B26\u89C4\u5F8B&nbsp;<code>p</code>\uFF0C\u8BF7\u4F60\u6765\u5B9E\u73B0\u4E00\u4E2A\u652F\u6301 <code>'.'</code>&nbsp;\u548C&nbsp;<code>'*'</code>&nbsp;\u7684\u6B63\u5219\u8868\u8FBE\u5F0F\u5339\u914D\u3002</p>

<ul>
	<li><code>'.'</code> \u5339\u914D\u4EFB\u610F\u5355\u4E2A\u5B57\u7B26</li>
	<li><code>'*'</code> \u5339\u914D\u96F6\u4E2A\u6216\u591A\u4E2A\u524D\u9762\u7684\u90A3\u4E00\u4E2A\u5143\u7D20</li>
</ul>

<p>\u6240\u8C13\u5339\u914D\uFF0C\u662F\u8981\u6DB5\u76D6&nbsp;<strong>\u6574\u4E2A&nbsp;</strong>\u5B57\u7B26\u4E32&nbsp;<code>s</code>\u7684\uFF0C\u800C\u4E0D\u662F\u90E8\u5206\u5B57\u7B26\u4E32\u3002</p>
&nbsp;

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "aa", p = "a"
<strong>\u8F93\u51FA\uFF1A</strong>false
<strong>\u89E3\u91CA\uFF1A</strong>"a" \u65E0\u6CD5\u5339\u914D "aa" \u6574\u4E2A\u5B57\u7B26\u4E32\u3002
</pre>

<p><strong>\u793A\u4F8B 2:</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "aa", p = "a*"
<strong>\u8F93\u51FA\uFF1A</strong>true
<strong>\u89E3\u91CA\uFF1A</strong>\u56E0\u4E3A '*' \u4EE3\u8868\u53EF\u4EE5\u5339\u914D\u96F6\u4E2A\u6216\u591A\u4E2A\u524D\u9762\u7684\u90A3\u4E00\u4E2A\u5143\u7D20, \u5728\u8FD9\u91CC\u524D\u9762\u7684\u5143\u7D20\u5C31\u662F 'a'\u3002\u56E0\u6B64\uFF0C\u5B57\u7B26\u4E32 "aa" \u53EF\u88AB\u89C6\u4E3A 'a' \u91CD\u590D\u4E86\u4E00\u6B21\u3002
</pre>

<p><strong>\u793A\u4F8B&nbsp;3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "ab", p = ".*"
<strong>\u8F93\u51FA\uFF1A</strong>true
<strong>\u89E3\u91CA\uFF1A</strong>".*" \u8868\u793A\u53EF\u5339\u914D\u96F6\u4E2A\u6216\u591A\u4E2A\uFF08'*'\uFF09\u4EFB\u610F\u5B57\u7B26\uFF08'.'\uFF09\u3002
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= s.length&nbsp;&lt;= 20</code></li>
	<li><code>1 &lt;= p.length&nbsp;&lt;= 20</code></li>
	<li><code>s</code>&nbsp;\u53EA\u5305\u542B\u4ECE&nbsp;<code>a-z</code>&nbsp;\u7684\u5C0F\u5199\u5B57\u6BCD\u3002</li>
	<li><code>p</code>&nbsp;\u53EA\u5305\u542B\u4ECE&nbsp;<code>a-z</code>&nbsp;\u7684\u5C0F\u5199\u5B57\u6BCD\uFF0C\u4EE5\u53CA\u5B57\u7B26&nbsp;<code>.</code>&nbsp;\u548C&nbsp;<code>*</code>\u3002</li>
	<li>\u4FDD\u8BC1\u6BCF\u6B21\u51FA\u73B0\u5B57\u7B26&nbsp;<code>*</code> \u65F6\uFF0C\u524D\u9762\u90FD\u5339\u914D\u5230\u6709\u6548\u7684\u5B57\u7B26</li>
</ul>
`,isPlus:!1},{problemsName:" 11.\u76DB\u6700\u591A\u6C34\u7684\u5BB9\u5668",hardRate:"MEDIUM",passRate:"60.21%",problemsUrl:"https://leetcode.cn/problems/container-with-most-water/",solutionsUrl:"https://leetcode.cn/problems/container-with-most-water/solution",problemsDesc:`<p>\u7ED9\u5B9A\u4E00\u4E2A\u957F\u5EA6\u4E3A <code>n</code> \u7684\u6574\u6570\u6570\u7EC4&nbsp;<code>height</code>&nbsp;\u3002\u6709&nbsp;<code>n</code>&nbsp;\u6761\u5782\u7EBF\uFF0C\u7B2C <code>i</code> \u6761\u7EBF\u7684\u4E24\u4E2A\u7AEF\u70B9\u662F&nbsp;<code>(i, 0)</code>&nbsp;\u548C&nbsp;<code>(i, height[i])</code>&nbsp;\u3002</p>

<p>\u627E\u51FA\u5176\u4E2D\u7684\u4E24\u6761\u7EBF\uFF0C\u4F7F\u5F97\u5B83\u4EEC\u4E0E&nbsp;<code>x</code>&nbsp;\u8F74\u5171\u540C\u6784\u6210\u7684\u5BB9\u5668\u53EF\u4EE5\u5BB9\u7EB3\u6700\u591A\u7684\u6C34\u3002</p>

<p>\u8FD4\u56DE\u5BB9\u5668\u53EF\u4EE5\u50A8\u5B58\u7684\u6700\u5927\u6C34\u91CF\u3002</p>

<p><strong>\u8BF4\u660E\uFF1A</strong>\u4F60\u4E0D\u80FD\u503E\u659C\u5BB9\u5668\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<p><img alt="" src="https://aliyun-lc-upload.oss-cn-hangzhou.aliyuncs.com/aliyun-lc-upload/uploads/2018/07/25/question_11.jpg" /></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>[1,8,6,2,5,4,8,3,7]
<strong>\u8F93\u51FA\uFF1A</strong>49 
<strong>\u89E3\u91CA\uFF1A</strong>\u56FE\u4E2D\u5782\u76F4\u7EBF\u4EE3\u8868\u8F93\u5165\u6570\u7EC4 [1,8,6,2,5,4,8,3,7]\u3002\u5728\u6B64\u60C5\u51B5\u4E0B\uFF0C\u5BB9\u5668\u80FD\u591F\u5BB9\u7EB3\u6C34\uFF08\u8868\u793A\u4E3A\u84DD\u8272\u90E8\u5206\uFF09\u7684\u6700\u5927\u503C\u4E3A&nbsp;49\u3002</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>height = [1,1]
<strong>\u8F93\u51FA\uFF1A</strong>1
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>n == height.length</code></li>
	<li><code>2 &lt;= n &lt;= 10<sup>5</sup></code></li>
	<li><code>0 &lt;= height[i] &lt;= 10<sup>4</sup></code></li>
</ul>
`,isPlus:!1},{problemsName:" 12.\u6574\u6570\u8F6C\u7F57\u9A6C\u6570\u5B57",hardRate:"MEDIUM",passRate:"66.14%",problemsUrl:"https://leetcode.cn/problems/integer-to-roman/",solutionsUrl:"https://leetcode.cn/problems/integer-to-roman/solution",problemsDesc:`<p>\u7F57\u9A6C\u6570\u5B57\u5305\u542B\u4EE5\u4E0B\u4E03\u79CD\u5B57\u7B26\uFF1A\xA0<code>I</code>\uFF0C\xA0<code>V</code>\uFF0C\xA0<code>X</code>\uFF0C\xA0<code>L</code>\uFF0C<code>C</code>\uFF0C<code>D</code>\xA0\u548C\xA0<code>M</code>\u3002</p>

<pre>
<strong>\u5B57\u7B26</strong>          <strong>\u6570\u503C</strong>
I             1
V             5
X             10
L             50
C             100
D             500
M             1000</pre>

<p>\u4F8B\u5982\uFF0C \u7F57\u9A6C\u6570\u5B57 2 \u5199\u505A\xA0<code>II</code>\xA0\uFF0C\u5373\u4E3A\u4E24\u4E2A\u5E76\u5217\u7684 1\u300212 \u5199\u505A\xA0<code>XII</code>\xA0\uFF0C\u5373\u4E3A\xA0<code>X</code>\xA0+\xA0<code>II</code>\xA0\u3002 27 \u5199\u505A\xA0\xA0<code>XXVII</code>, \u5373\u4E3A\xA0<code>XX</code>\xA0+\xA0<code>V</code>\xA0+\xA0<code>II</code>\xA0\u3002</p>

<p>\u901A\u5E38\u60C5\u51B5\u4E0B\uFF0C\u7F57\u9A6C\u6570\u5B57\u4E2D\u5C0F\u7684\u6570\u5B57\u5728\u5927\u7684\u6570\u5B57\u7684\u53F3\u8FB9\u3002\u4F46\u4E5F\u5B58\u5728\u7279\u4F8B\uFF0C\u4F8B\u5982 4 \u4E0D\u5199\u505A\xA0<code>IIII</code>\uFF0C\u800C\u662F\xA0<code>IV</code>\u3002\u6570\u5B57 1 \u5728\u6570\u5B57 5 \u7684\u5DE6\u8FB9\uFF0C\u6240\u8868\u793A\u7684\u6570\u7B49\u4E8E\u5927\u6570 5 \u51CF\u5C0F\u6570 1 \u5F97\u5230\u7684\u6570\u503C 4 \u3002\u540C\u6837\u5730\uFF0C\u6570\u5B57 9 \u8868\u793A\u4E3A\xA0<code>IX</code>\u3002\u8FD9\u4E2A\u7279\u6B8A\u7684\u89C4\u5219\u53EA\u9002\u7528\u4E8E\u4EE5\u4E0B\u516D\u79CD\u60C5\u51B5\uFF1A</p>

<ul>
	<li><code>I</code>\xA0\u53EF\u4EE5\u653E\u5728\xA0<code>V</code>\xA0(5) \u548C\xA0<code>X</code>\xA0(10) \u7684\u5DE6\u8FB9\uFF0C\u6765\u8868\u793A 4 \u548C 9\u3002</li>
	<li><code>X</code>\xA0\u53EF\u4EE5\u653E\u5728\xA0<code>L</code>\xA0(50) \u548C\xA0<code>C</code>\xA0(100) \u7684\u5DE6\u8FB9\uFF0C\u6765\u8868\u793A 40 \u548C\xA090\u3002\xA0</li>
	<li><code>C</code>\xA0\u53EF\u4EE5\u653E\u5728\xA0<code>D</code>\xA0(500) \u548C\xA0<code>M</code>\xA0(1000) \u7684\u5DE6\u8FB9\uFF0C\u6765\u8868\u793A\xA0400 \u548C\xA0900\u3002</li>
</ul>

<p>\u7ED9\u4F60\u4E00\u4E2A\u6574\u6570\uFF0C\u5C06\u5176\u8F6C\u4E3A\u7F57\u9A6C\u6570\u5B57\u3002</p>

<p>\xA0</p>

<p><strong>\u793A\u4F8B\xA01:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong>\xA0num = 3
<strong>\u8F93\u51FA:</strong> "III"</pre>

<p><strong>\u793A\u4F8B\xA02:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong>\xA0num = 4
<strong>\u8F93\u51FA:</strong> "IV"</pre>

<p><strong>\u793A\u4F8B\xA03:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong>\xA0num = 9
<strong>\u8F93\u51FA:</strong> "IX"</pre>

<p><strong>\u793A\u4F8B\xA04:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong>\xA0num = 58
<strong>\u8F93\u51FA:</strong> "LVIII"
<strong>\u89E3\u91CA:</strong> L = 50, V = 5, III = 3.
</pre>

<p><strong>\u793A\u4F8B\xA05:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong>\xA0num = 1994
<strong>\u8F93\u51FA:</strong> "MCMXCIV"
<strong>\u89E3\u91CA:</strong> M = 1000, CM = 900, XC = 90, IV = 4.</pre>

<p>\xA0</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 <= num <= 3999</code></li>
</ul>
`,isPlus:!1},{problemsName:" 13.\u7F57\u9A6C\u6570\u5B57\u8F6C\u6574\u6570",hardRate:"EASY",passRate:"62.01%",problemsUrl:"https://leetcode.cn/problems/roman-to-integer/",solutionsUrl:"https://leetcode.cn/problems/roman-to-integer/solution",problemsDesc:`<p>\u7F57\u9A6C\u6570\u5B57\u5305\u542B\u4EE5\u4E0B\u4E03\u79CD\u5B57\u7B26:&nbsp;<code>I</code>\uFF0C&nbsp;<code>V</code>\uFF0C&nbsp;<code>X</code>\uFF0C&nbsp;<code>L</code>\uFF0C<code>C</code>\uFF0C<code>D</code>&nbsp;\u548C&nbsp;<code>M</code>\u3002</p>

<pre>
<strong>\u5B57\u7B26</strong>          <strong>\u6570\u503C</strong>
I             1
V             5
X             10
L             50
C             100
D             500
M             1000</pre>

<p>\u4F8B\u5982\uFF0C \u7F57\u9A6C\u6570\u5B57 <code>2</code> \u5199\u505A&nbsp;<code>II</code>&nbsp;\uFF0C\u5373\u4E3A\u4E24\u4E2A\u5E76\u5217\u7684 1 \u3002<code>12</code> \u5199\u505A&nbsp;<code>XII</code>&nbsp;\uFF0C\u5373\u4E3A&nbsp;<code>X</code>&nbsp;+&nbsp;<code>II</code>&nbsp;\u3002 <code>27</code> \u5199\u505A&nbsp;&nbsp;<code>XXVII</code>, \u5373\u4E3A&nbsp;<code>XX</code>&nbsp;+&nbsp;<code>V</code>&nbsp;+&nbsp;<code>II</code>&nbsp;\u3002</p>

<p>\u901A\u5E38\u60C5\u51B5\u4E0B\uFF0C\u7F57\u9A6C\u6570\u5B57\u4E2D\u5C0F\u7684\u6570\u5B57\u5728\u5927\u7684\u6570\u5B57\u7684\u53F3\u8FB9\u3002\u4F46\u4E5F\u5B58\u5728\u7279\u4F8B\uFF0C\u4F8B\u5982 4 \u4E0D\u5199\u505A&nbsp;<code>IIII</code>\uFF0C\u800C\u662F&nbsp;<code>IV</code>\u3002\u6570\u5B57 1 \u5728\u6570\u5B57 5 \u7684\u5DE6\u8FB9\uFF0C\u6240\u8868\u793A\u7684\u6570\u7B49\u4E8E\u5927\u6570 5 \u51CF\u5C0F\u6570 1 \u5F97\u5230\u7684\u6570\u503C 4 \u3002\u540C\u6837\u5730\uFF0C\u6570\u5B57 9 \u8868\u793A\u4E3A&nbsp;<code>IX</code>\u3002\u8FD9\u4E2A\u7279\u6B8A\u7684\u89C4\u5219\u53EA\u9002\u7528\u4E8E\u4EE5\u4E0B\u516D\u79CD\u60C5\u51B5\uFF1A</p>

<ul>
	<li><code>I</code>&nbsp;\u53EF\u4EE5\u653E\u5728&nbsp;<code>V</code>&nbsp;(5) \u548C&nbsp;<code>X</code>&nbsp;(10) \u7684\u5DE6\u8FB9\uFF0C\u6765\u8868\u793A 4 \u548C 9\u3002</li>
	<li><code>X</code>&nbsp;\u53EF\u4EE5\u653E\u5728&nbsp;<code>L</code>&nbsp;(50) \u548C&nbsp;<code>C</code>&nbsp;(100) \u7684\u5DE6\u8FB9\uFF0C\u6765\u8868\u793A 40 \u548C&nbsp;90\u3002&nbsp;</li>
	<li><code>C</code>&nbsp;\u53EF\u4EE5\u653E\u5728&nbsp;<code>D</code>&nbsp;(500) \u548C&nbsp;<code>M</code>&nbsp;(1000) \u7684\u5DE6\u8FB9\uFF0C\u6765\u8868\u793A&nbsp;400 \u548C&nbsp;900\u3002</li>
</ul>

<p>\u7ED9\u5B9A\u4E00\u4E2A\u7F57\u9A6C\u6570\u5B57\uFF0C\u5C06\u5176\u8F6C\u6362\u6210\u6574\u6570\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B&nbsp;1:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong>&nbsp;s = "III"
<strong>\u8F93\u51FA:</strong> 3</pre>

<p><strong>\u793A\u4F8B&nbsp;2:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong>&nbsp;s = "IV"
<strong>\u8F93\u51FA:</strong> 4</pre>

<p><strong>\u793A\u4F8B&nbsp;3:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong>&nbsp;s = "IX"
<strong>\u8F93\u51FA:</strong> 9</pre>

<p><strong>\u793A\u4F8B&nbsp;4:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong>&nbsp;s = "LVIII"
<strong>\u8F93\u51FA:</strong> 58
<strong>\u89E3\u91CA:</strong> L = 50, V= 5, III = 3.
</pre>

<p><strong>\u793A\u4F8B&nbsp;5:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong>&nbsp;s = "MCMXCIV"
<strong>\u8F93\u51FA:</strong> 1994
<strong>\u89E3\u91CA:</strong> M = 1000, CM = 900, XC = 90, IV = 4.</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= s.length &lt;= 15</code></li>
	<li><code>s</code> \u4EC5\u542B\u5B57\u7B26 <code>('I', 'V', 'X', 'L', 'C', 'D', 'M')</code></li>
	<li>\u9898\u76EE\u6570\u636E\u4FDD\u8BC1 <code>s</code> \u662F\u4E00\u4E2A\u6709\u6548\u7684\u7F57\u9A6C\u6570\u5B57\uFF0C\u4E14\u8868\u793A\u6574\u6570\u5728\u8303\u56F4 <code>[1, 3999]</code> \u5185</li>
	<li>\u9898\u76EE\u6240\u7ED9\u6D4B\u8BD5\u7528\u4F8B\u7686\u7B26\u5408\u7F57\u9A6C\u6570\u5B57\u4E66\u5199\u89C4\u5219\uFF0C\u4E0D\u4F1A\u51FA\u73B0\u8DE8\u4F4D\u7B49\u60C5\u51B5\u3002</li>
	<li>IL \u548C IM \u8FD9\u6837\u7684\u4F8B\u5B50\u5E76\u4E0D\u7B26\u5408\u9898\u76EE\u8981\u6C42\uFF0C49 \u5E94\u8BE5\u5199\u4F5C XLIX\uFF0C999 \u5E94\u8BE5\u5199\u4F5C CMXCIX \u3002</li>
	<li>\u5173\u4E8E\u7F57\u9A6C\u6570\u5B57\u7684\u8BE6\u5C3D\u4E66\u5199\u89C4\u5219\uFF0C\u53EF\u4EE5\u53C2\u8003 <a href="https://b2b.partcommunity.com/community/knowledge/zh_CN/detail/10753/%E7%BD%97%E9%A9%AC%E6%95%B0%E5%AD%97#knowledge_article">\u7F57\u9A6C\u6570\u5B57 - Mathematics </a>\u3002</li>
</ul>
`,isPlus:!1},{problemsName:" 14.\u6700\u957F\u516C\u5171\u524D\u7F00",hardRate:"EASY",passRate:"43.39%",problemsUrl:"https://leetcode.cn/problems/longest-common-prefix/",solutionsUrl:"https://leetcode.cn/problems/longest-common-prefix/solution",problemsDesc:`<p>\u7F16\u5199\u4E00\u4E2A\u51FD\u6570\u6765\u67E5\u627E\u5B57\u7B26\u4E32\u6570\u7EC4\u4E2D\u7684\u6700\u957F\u516C\u5171\u524D\u7F00\u3002</p>

<p>\u5982\u679C\u4E0D\u5B58\u5728\u516C\u5171\u524D\u7F00\uFF0C\u8FD4\u56DE\u7A7A\u5B57\u7B26\u4E32&nbsp;<code>""</code>\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>strs = ["flower","flow","flight"]
<strong>\u8F93\u51FA\uFF1A</strong>"fl"
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>strs = ["dog","racecar","car"]
<strong>\u8F93\u51FA\uFF1A</strong>""
<strong>\u89E3\u91CA\uFF1A</strong>\u8F93\u5165\u4E0D\u5B58\u5728\u516C\u5171\u524D\u7F00\u3002</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= strs.length &lt;= 200</code></li>
	<li><code>0 &lt;= strs[i].length &lt;= 200</code></li>
	<li><code>strs[i]</code> \u4EC5\u7531\u5C0F\u5199\u82F1\u6587\u5B57\u6BCD\u7EC4\u6210</li>
</ul>
`,isPlus:!1},{problemsName:" 15.\u4E09\u6570\u4E4B\u548C",hardRate:"MEDIUM",passRate:"37.18%",problemsUrl:"https://leetcode.cn/problems/3sum/",solutionsUrl:"https://leetcode.cn/problems/3sum/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A\u6574\u6570\u6570\u7EC4 <code>nums</code> \uFF0C\u5224\u65AD\u662F\u5426\u5B58\u5728\u4E09\u5143\u7EC4 <code>[nums[i], nums[j], nums[k]]</code> \u6EE1\u8DB3 <code>i != j</code>\u3001<code>i != k</code> \u4E14 <code>j != k</code> \uFF0C\u540C\u65F6\u8FD8\u6EE1\u8DB3 <code>nums[i] + nums[j] + nums[k] == 0</code> \u3002\u8BF7</p>

<p>\u4F60\u8FD4\u56DE\u6240\u6709\u548C\u4E3A <code>0</code> \u4E14\u4E0D\u91CD\u590D\u7684\u4E09\u5143\u7EC4\u3002</p>

<p><strong>\u6CE8\u610F\uFF1A</strong>\u7B54\u6848\u4E2D\u4E0D\u53EF\u4EE5\u5305\u542B\u91CD\u590D\u7684\u4E09\u5143\u7EC4\u3002</p>

<p>&nbsp;</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [-1,0,1,2,-1,-4]
<strong>\u8F93\u51FA\uFF1A</strong>[[-1,-1,2],[-1,0,1]]
<strong>\u89E3\u91CA\uFF1A</strong>
nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0 \u3002
nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0 \u3002
nums[0] + nums[3] + nums[4] = (-1) + 2 + (-1) = 0 \u3002
\u4E0D\u540C\u7684\u4E09\u5143\u7EC4\u662F [-1,0,1] \u548C [-1,-1,2] \u3002
\u6CE8\u610F\uFF0C\u8F93\u51FA\u7684\u987A\u5E8F\u548C\u4E09\u5143\u7EC4\u7684\u987A\u5E8F\u5E76\u4E0D\u91CD\u8981\u3002
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [0,1,1]
<strong>\u8F93\u51FA\uFF1A</strong>[]
<strong>\u89E3\u91CA\uFF1A</strong>\u552F\u4E00\u53EF\u80FD\u7684\u4E09\u5143\u7EC4\u548C\u4E0D\u4E3A 0 \u3002
</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [0,0,0]
<strong>\u8F93\u51FA\uFF1A</strong>[[0,0,0]]
<strong>\u89E3\u91CA\uFF1A</strong>\u552F\u4E00\u53EF\u80FD\u7684\u4E09\u5143\u7EC4\u548C\u4E3A 0 \u3002
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>3 &lt;= nums.length &lt;= 3000</code></li>
	<li><code>-10<sup>5</sup> &lt;= nums[i] &lt;= 10<sup>5</sup></code></li>
</ul>
`,isPlus:!1},{problemsName:" 16.\u6700\u63A5\u8FD1\u7684\u4E09\u6570\u4E4B\u548C",hardRate:"MEDIUM",passRate:"45.09%",problemsUrl:"https://leetcode.cn/problems/3sum-closest/",solutionsUrl:"https://leetcode.cn/problems/3sum-closest/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A\u957F\u5EA6\u4E3A <code>n</code> \u7684\u6574\u6570\u6570\u7EC4&nbsp;<code>nums</code><em>&nbsp;</em>\u548C \u4E00\u4E2A\u76EE\u6807\u503C&nbsp;<code>target</code>\u3002\u8BF7\u4F60\u4ECE <code>nums</code><em> </em>\u4E2D\u9009\u51FA\u4E09\u4E2A\u6574\u6570\uFF0C\u4F7F\u5B83\u4EEC\u7684\u548C\u4E0E&nbsp;<code>target</code>&nbsp;\u6700\u63A5\u8FD1\u3002</p>

<p>\u8FD4\u56DE\u8FD9\u4E09\u4E2A\u6570\u7684\u548C\u3002</p>

<p>\u5047\u5B9A\u6BCF\u7EC4\u8F93\u5165\u53EA\u5B58\u5728\u6070\u597D\u4E00\u4E2A\u89E3\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [-1,2,1,-4], target = 1
<strong>\u8F93\u51FA\uFF1A</strong>2
<strong>\u89E3\u91CA\uFF1A</strong>\u4E0E target \u6700\u63A5\u8FD1\u7684\u548C\u662F 2 (-1 + 2 + 1 = 2) \u3002
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [0,0,0], target = 1
<strong>\u8F93\u51FA\uFF1A</strong>0
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>3 &lt;= nums.length &lt;= 1000</code></li>
	<li><code>-1000 &lt;= nums[i] &lt;= 1000</code></li>
	<li><code>-10<sup>4</sup> &lt;= target &lt;= 10<sup>4</sup></code></li>
</ul>
`,isPlus:!1},{problemsName:" 17.\u7535\u8BDD\u53F7\u7801\u7684\u5B57\u6BCD\u7EC4\u5408",hardRate:"MEDIUM",passRate:"58.08%",problemsUrl:"https://leetcode.cn/problems/letter-combinations-of-a-phone-number/",solutionsUrl:"https://leetcode.cn/problems/letter-combinations-of-a-phone-number/solution",problemsDesc:`<p>\u7ED9\u5B9A\u4E00\u4E2A\u4EC5\u5305\u542B\u6570\u5B57&nbsp;<code>2-9</code>&nbsp;\u7684\u5B57\u7B26\u4E32\uFF0C\u8FD4\u56DE\u6240\u6709\u5B83\u80FD\u8868\u793A\u7684\u5B57\u6BCD\u7EC4\u5408\u3002\u7B54\u6848\u53EF\u4EE5\u6309 <strong>\u4EFB\u610F\u987A\u5E8F</strong> \u8FD4\u56DE\u3002</p>

<p>\u7ED9\u51FA\u6570\u5B57\u5230\u5B57\u6BCD\u7684\u6620\u5C04\u5982\u4E0B\uFF08\u4E0E\u7535\u8BDD\u6309\u952E\u76F8\u540C\uFF09\u3002\u6CE8\u610F 1 \u4E0D\u5BF9\u5E94\u4EFB\u4F55\u5B57\u6BCD\u3002</p>

<p><img src="https://assets.leetcode-cn.com/aliyun-lc-upload/uploads/2021/11/09/200px-telephone-keypad2svg.png" style="width: 200px;" /></p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>digits = "23"
<strong>\u8F93\u51FA\uFF1A</strong>["ad","ae","af","bd","be","bf","cd","ce","cf"]
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>digits = ""
<strong>\u8F93\u51FA\uFF1A</strong>[]
</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>digits = "2"
<strong>\u8F93\u51FA\uFF1A</strong>["a","b","c"]
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>0 &lt;= digits.length &lt;= 4</code></li>
	<li><code>digits[i]</code> \u662F\u8303\u56F4 <code>['2', '9']</code> \u7684\u4E00\u4E2A\u6570\u5B57\u3002</li>
</ul>
`,isPlus:!1},{problemsName:" 18.\u56DB\u6570\u4E4B\u548C",hardRate:"MEDIUM",passRate:"36.93%",problemsUrl:"https://leetcode.cn/problems/4sum/",solutionsUrl:"https://leetcode.cn/problems/4sum/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A\u7531 <code>n</code> \u4E2A\u6574\u6570\u7EC4\u6210\u7684\u6570\u7EC4&nbsp;<code>nums</code> \uFF0C\u548C\u4E00\u4E2A\u76EE\u6807\u503C <code>target</code> \u3002\u8BF7\u4F60\u627E\u51FA\u5E76\u8FD4\u56DE\u6EE1\u8DB3\u4E0B\u8FF0\u5168\u90E8\u6761\u4EF6\u4E14<strong>\u4E0D\u91CD\u590D</strong>\u7684\u56DB\u5143\u7EC4&nbsp;<code>[nums[a], nums[b], nums[c], nums[d]]</code>&nbsp;\uFF08\u82E5\u4E24\u4E2A\u56DB\u5143\u7EC4\u5143\u7D20\u4E00\u4E00\u5BF9\u5E94\uFF0C\u5219\u8BA4\u4E3A\u4E24\u4E2A\u56DB\u5143\u7EC4\u91CD\u590D\uFF09\uFF1A</p>

<ul>
	<li><code>0 &lt;= a, b, c, d&nbsp;&lt; n</code></li>
	<li><code>a</code>\u3001<code>b</code>\u3001<code>c</code> \u548C <code>d</code> <strong>\u4E92\u4E0D\u76F8\u540C</strong></li>
	<li><code>nums[a] + nums[b] + nums[c] + nums[d] == target</code></li>
</ul>

<p>\u4F60\u53EF\u4EE5\u6309 <strong>\u4EFB\u610F\u987A\u5E8F</strong> \u8FD4\u56DE\u7B54\u6848 \u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [1,0,-1,0,-2,2], target = 0
<strong>\u8F93\u51FA\uFF1A</strong>[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [2,2,2,2,2], target = 8
<strong>\u8F93\u51FA\uFF1A</strong>[[2,2,2,2]]
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= nums.length &lt;= 200</code></li>
	<li><code>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></code></li>
	<li><code>-10<sup>9</sup> &lt;= target &lt;= 10<sup>9</sup></code></li>
</ul>
`,isPlus:!1},{problemsName:" 19.\u5220\u9664\u94FE\u8868\u7684\u5012\u6570\u7B2C N \u4E2A\u7ED3\u70B9",hardRate:"MEDIUM",passRate:"45.70%",problemsUrl:"https://leetcode.cn/problems/remove-nth-node-from-end-of-list/",solutionsUrl:"https://leetcode.cn/problems/remove-nth-node-from-end-of-list/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A\u94FE\u8868\uFF0C\u5220\u9664\u94FE\u8868\u7684\u5012\u6570\u7B2C&nbsp;<code>n</code><em>&nbsp;</em>\u4E2A\u7ED3\u70B9\uFF0C\u5E76\u4E14\u8FD4\u56DE\u94FE\u8868\u7684\u5934\u7ED3\u70B9\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>
<img alt="" src="https://assets.leetcode.com/uploads/2020/10/03/remove_ex1.jpg" style="width: 542px; height: 222px;" />
<pre>
<strong>\u8F93\u5165\uFF1A</strong>head = [1,2,3,4,5], n = 2
<strong>\u8F93\u51FA\uFF1A</strong>[1,2,3,5]
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>head = [1], n = 1
<strong>\u8F93\u51FA\uFF1A</strong>[]
</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>head = [1,2], n = 1
<strong>\u8F93\u51FA\uFF1A</strong>[1]
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li>\u94FE\u8868\u4E2D\u7ED3\u70B9\u7684\u6570\u76EE\u4E3A <code>sz</code></li>
	<li><code>1 &lt;= sz &lt;= 30</code></li>
	<li><code>0 &lt;= Node.val &lt;= 100</code></li>
	<li><code>1 &lt;= n &lt;= sz</code></li>
</ul>

<p>&nbsp;</p>

<p><strong>\u8FDB\u9636\uFF1A</strong>\u4F60\u80FD\u5C1D\u8BD5\u4F7F\u7528\u4E00\u8D9F\u626B\u63CF\u5B9E\u73B0\u5417\uFF1F</p>
`,isPlus:!1},{problemsName:" 20.\u6709\u6548\u7684\u62EC\u53F7",hardRate:"EASY",passRate:"44.02%",problemsUrl:"https://leetcode.cn/problems/valid-parentheses/",solutionsUrl:"https://leetcode.cn/problems/valid-parentheses/solution",problemsDesc:`<p>\u7ED9\u5B9A\u4E00\u4E2A\u53EA\u5305\u62EC <code>'('</code>\uFF0C<code>')'</code>\uFF0C<code>'{'</code>\uFF0C<code>'}'</code>\uFF0C<code>'['</code>\uFF0C<code>']'</code>&nbsp;\u7684\u5B57\u7B26\u4E32 <code>s</code> \uFF0C\u5224\u65AD\u5B57\u7B26\u4E32\u662F\u5426\u6709\u6548\u3002</p>

<p>\u6709\u6548\u5B57\u7B26\u4E32\u9700\u6EE1\u8DB3\uFF1A</p>

<ol>
	<li>\u5DE6\u62EC\u53F7\u5FC5\u987B\u7528\u76F8\u540C\u7C7B\u578B\u7684\u53F3\u62EC\u53F7\u95ED\u5408\u3002</li>
	<li>\u5DE6\u62EC\u53F7\u5FC5\u987B\u4EE5\u6B63\u786E\u7684\u987A\u5E8F\u95ED\u5408\u3002</li>
	<li>\u6BCF\u4E2A\u53F3\u62EC\u53F7\u90FD\u6709\u4E00\u4E2A\u5BF9\u5E94\u7684\u76F8\u540C\u7C7B\u578B\u7684\u5DE6\u62EC\u53F7\u3002</li>
</ol>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "()"
<strong>\u8F93\u51FA\uFF1A</strong>true
</pre>

<p><strong>\u793A\u4F8B&nbsp;2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "()[]{}"
<strong>\u8F93\u51FA\uFF1A</strong>true
</pre>

<p><strong>\u793A\u4F8B&nbsp;3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "(]"
<strong>\u8F93\u51FA\uFF1A</strong>false
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= s.length &lt;= 10<sup>4</sup></code></li>
	<li><code>s</code> \u4EC5\u7531\u62EC\u53F7 <code>'()[]{}'</code> \u7EC4\u6210</li>
</ul>
`,isPlus:!1},{problemsName:" 21.\u5408\u5E76\u4E24\u4E2A\u6709\u5E8F\u94FE\u8868",hardRate:"EASY",passRate:"66.17%",problemsUrl:"https://leetcode.cn/problems/merge-two-sorted-lists/",solutionsUrl:"https://leetcode.cn/problems/merge-two-sorted-lists/solution",problemsDesc:`<p>\u5C06\u4E24\u4E2A\u5347\u5E8F\u94FE\u8868\u5408\u5E76\u4E3A\u4E00\u4E2A\u65B0\u7684 <strong>\u5347\u5E8F</strong> \u94FE\u8868\u5E76\u8FD4\u56DE\u3002\u65B0\u94FE\u8868\u662F\u901A\u8FC7\u62FC\u63A5\u7ED9\u5B9A\u7684\u4E24\u4E2A\u94FE\u8868\u7684\u6240\u6709\u8282\u70B9\u7EC4\u6210\u7684\u3002\xA0</p>

<p>\xA0</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>
<img alt="" src="https://assets.leetcode.com/uploads/2020/10/03/merge_ex1.jpg" style="width: 662px; height: 302px;" />
<pre>
<strong>\u8F93\u5165\uFF1A</strong>l1 = [1,2,4], l2 = [1,3,4]
<strong>\u8F93\u51FA\uFF1A</strong>[1,1,2,3,4,4]
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>l1 = [], l2 = []
<strong>\u8F93\u51FA\uFF1A</strong>[]
</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>l1 = [], l2 = [0]
<strong>\u8F93\u51FA\uFF1A</strong>[0]
</pre>

<p>\xA0</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li>\u4E24\u4E2A\u94FE\u8868\u7684\u8282\u70B9\u6570\u76EE\u8303\u56F4\u662F <code>[0, 50]</code></li>
	<li><code>-100 <= Node.val <= 100</code></li>
	<li><code>l1</code> \u548C <code>l2</code> \u5747\u6309 <strong>\u975E\u9012\u51CF\u987A\u5E8F</strong> \u6392\u5217</li>
</ul>
`,isPlus:!1},{problemsName:" 22.\u62EC\u53F7\u751F\u6210",hardRate:"MEDIUM",passRate:"77.45%",problemsUrl:"https://leetcode.cn/problems/generate-parentheses/",solutionsUrl:"https://leetcode.cn/problems/generate-parentheses/solution",problemsDesc:`<p>\u6570\u5B57 <code>n</code>&nbsp;\u4EE3\u8868\u751F\u6210\u62EC\u53F7\u7684\u5BF9\u6570\uFF0C\u8BF7\u4F60\u8BBE\u8BA1\u4E00\u4E2A\u51FD\u6570\uFF0C\u7528\u4E8E\u80FD\u591F\u751F\u6210\u6240\u6709\u53EF\u80FD\u7684\u5E76\u4E14 <strong>\u6709\u6548\u7684 </strong>\u62EC\u53F7\u7EC4\u5408\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>n = 3
<strong>\u8F93\u51FA\uFF1A</strong>["((()))","(()())","(())()","()(())","()()()"]
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>n = 1
<strong>\u8F93\u51FA\uFF1A</strong>["()"]
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= n &lt;= 8</code></li>
</ul>
`,isPlus:!1},{problemsName:" 23.\u5408\u5E76 K \u4E2A\u5347\u5E8F\u94FE\u8868",hardRate:"HARD",passRate:"57.84%",problemsUrl:"https://leetcode.cn/problems/merge-k-sorted-lists/",solutionsUrl:"https://leetcode.cn/problems/merge-k-sorted-lists/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A\u94FE\u8868\u6570\u7EC4\uFF0C\u6BCF\u4E2A\u94FE\u8868\u90FD\u5DF2\u7ECF\u6309\u5347\u5E8F\u6392\u5217\u3002</p>

<p>\u8BF7\u4F60\u5C06\u6240\u6709\u94FE\u8868\u5408\u5E76\u5230\u4E00\u4E2A\u5347\u5E8F\u94FE\u8868\u4E2D\uFF0C\u8FD4\u56DE\u5408\u5E76\u540E\u7684\u94FE\u8868\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre><strong>\u8F93\u5165\uFF1A</strong>lists = [[1,4,5],[1,3,4],[2,6]]
<strong>\u8F93\u51FA\uFF1A</strong>[1,1,2,3,4,4,5,6]
<strong>\u89E3\u91CA\uFF1A</strong>\u94FE\u8868\u6570\u7EC4\u5982\u4E0B\uFF1A
[
  1-&gt;4-&gt;5,
  1-&gt;3-&gt;4,
  2-&gt;6
]
\u5C06\u5B83\u4EEC\u5408\u5E76\u5230\u4E00\u4E2A\u6709\u5E8F\u94FE\u8868\u4E2D\u5F97\u5230\u3002
1-&gt;1-&gt;2-&gt;3-&gt;4-&gt;4-&gt;5-&gt;6
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre><strong>\u8F93\u5165\uFF1A</strong>lists = []
<strong>\u8F93\u51FA\uFF1A</strong>[]
</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre><strong>\u8F93\u5165\uFF1A</strong>lists = [[]]
<strong>\u8F93\u51FA\uFF1A</strong>[]
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>k == lists.length</code></li>
	<li><code>0 &lt;= k &lt;= 10^4</code></li>
	<li><code>0 &lt;= lists[i].length &lt;= 500</code></li>
	<li><code>-10^4 &lt;= lists[i][j] &lt;= 10^4</code></li>
	<li><code>lists[i]</code> \u6309 <strong>\u5347\u5E8F</strong> \u6392\u5217</li>
	<li><code>lists[i].length</code> \u7684\u603B\u548C\u4E0D\u8D85\u8FC7 <code>10^4</code></li>
</ul>
`,isPlus:!1},{problemsName:" 24.\u4E24\u4E24\u4EA4\u6362\u94FE\u8868\u4E2D\u7684\u8282\u70B9",hardRate:"MEDIUM",passRate:"71.28%",problemsUrl:"https://leetcode.cn/problems/swap-nodes-in-pairs/",solutionsUrl:"https://leetcode.cn/problems/swap-nodes-in-pairs/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A\u94FE\u8868\uFF0C\u4E24\u4E24\u4EA4\u6362\u5176\u4E2D\u76F8\u90BB\u7684\u8282\u70B9\uFF0C\u5E76\u8FD4\u56DE\u4EA4\u6362\u540E\u94FE\u8868\u7684\u5934\u8282\u70B9\u3002\u4F60\u5FC5\u987B\u5728\u4E0D\u4FEE\u6539\u8282\u70B9\u5185\u90E8\u7684\u503C\u7684\u60C5\u51B5\u4E0B\u5B8C\u6210\u672C\u9898\uFF08\u5373\uFF0C\u53EA\u80FD\u8FDB\u884C\u8282\u70B9\u4EA4\u6362\uFF09\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>
<img alt="" src="https://assets.leetcode.com/uploads/2020/10/03/swap_ex1.jpg" style="width: 422px; height: 222px;" />
<pre>
<strong>\u8F93\u5165\uFF1A</strong>head = [1,2,3,4]
<strong>\u8F93\u51FA\uFF1A</strong>[2,1,4,3]
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>head = []
<strong>\u8F93\u51FA\uFF1A</strong>[]
</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>head = [1]
<strong>\u8F93\u51FA\uFF1A</strong>[1]
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li>\u94FE\u8868\u4E2D\u8282\u70B9\u7684\u6570\u76EE\u5728\u8303\u56F4 <code>[0, 100]</code> \u5185</li>
	<li><code>0 &lt;= Node.val &lt;= 100</code></li>
</ul>
`,isPlus:!1},{problemsName:" 25.K \u4E2A\u4E00\u7EC4\u7FFB\u8F6C\u94FE\u8868",hardRate:"HARD",passRate:"67.63%",problemsUrl:"https://leetcode.cn/problems/reverse-nodes-in-k-group/",solutionsUrl:"https://leetcode.cn/problems/reverse-nodes-in-k-group/solution",problemsDesc:`<p>\u7ED9\u4F60\u94FE\u8868\u7684\u5934\u8282\u70B9 <code>head</code> \uFF0C\u6BCF&nbsp;<code>k</code><em>&nbsp;</em>\u4E2A\u8282\u70B9\u4E00\u7EC4\u8FDB\u884C\u7FFB\u8F6C\uFF0C\u8BF7\u4F60\u8FD4\u56DE\u4FEE\u6539\u540E\u7684\u94FE\u8868\u3002</p>

<p><code>k</code> \u662F\u4E00\u4E2A\u6B63\u6574\u6570\uFF0C\u5B83\u7684\u503C\u5C0F\u4E8E\u6216\u7B49\u4E8E\u94FE\u8868\u7684\u957F\u5EA6\u3002\u5982\u679C\u8282\u70B9\u603B\u6570\u4E0D\u662F&nbsp;<code>k</code><em>&nbsp;</em>\u7684\u6574\u6570\u500D\uFF0C\u90A3\u4E48\u8BF7\u5C06\u6700\u540E\u5269\u4F59\u7684\u8282\u70B9\u4FDD\u6301\u539F\u6709\u987A\u5E8F\u3002</p>

<p>\u4F60\u4E0D\u80FD\u53EA\u662F\u5355\u7EAF\u7684\u6539\u53D8\u8282\u70B9\u5185\u90E8\u7684\u503C\uFF0C\u800C\u662F\u9700\u8981\u5B9E\u9645\u8FDB\u884C\u8282\u70B9\u4EA4\u6362\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>
<img alt="" src="https://assets.leetcode.com/uploads/2020/10/03/reverse_ex1.jpg" style="width: 542px; height: 222px;" />
<pre>
<strong>\u8F93\u5165\uFF1A</strong>head = [1,2,3,4,5], k = 2
<strong>\u8F93\u51FA\uFF1A</strong>[2,1,4,3,5]
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<p><img alt="" src="https://assets.leetcode.com/uploads/2020/10/03/reverse_ex2.jpg" style="width: 542px; height: 222px;" /></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>head = [1,2,3,4,5], k = 3
<strong>\u8F93\u51FA\uFF1A</strong>[3,2,1,4,5]
</pre>

<p>&nbsp;</p>
<strong>\u63D0\u793A\uFF1A</strong>

<ul>
	<li>\u94FE\u8868\u4E2D\u7684\u8282\u70B9\u6570\u76EE\u4E3A <code>n</code></li>
	<li><code>1 &lt;= k &lt;= n &lt;= 5000</code></li>
	<li><code>0 &lt;= Node.val &lt;= 1000</code></li>
</ul>

<p>&nbsp;</p>

<p><strong>\u8FDB\u9636\uFF1A</strong>\u4F60\u53EF\u4EE5\u8BBE\u8BA1\u4E00\u4E2A\u53EA\u7528 <code>O(1)</code> \u989D\u5916\u5185\u5B58\u7A7A\u95F4\u7684\u7B97\u6CD5\u89E3\u51B3\u6B64\u95EE\u9898\u5417\uFF1F</p>

<ul>
</ul>
`,isPlus:!1},{problemsName:" 26.\u5220\u9664\u6709\u5E8F\u6570\u7EC4\u4E2D\u7684\u91CD\u590D\u9879",hardRate:"EASY",passRate:"54.82%",problemsUrl:"https://leetcode.cn/problems/remove-duplicates-from-sorted-array/",solutionsUrl:"https://leetcode.cn/problems/remove-duplicates-from-sorted-array/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A <strong>\u5347\u5E8F\u6392\u5217</strong> \u7684\u6570\u7EC4 <code>nums</code> \uFF0C\u8BF7\u4F60<strong><a href="http://baike.baidu.com/item/%E5%8E%9F%E5%9C%B0%E7%AE%97%E6%B3%95" target="_blank"> \u539F\u5730</a></strong> \u5220\u9664\u91CD\u590D\u51FA\u73B0\u7684\u5143\u7D20\uFF0C\u4F7F\u6BCF\u4E2A\u5143\u7D20 <strong>\u53EA\u51FA\u73B0\u4E00\u6B21</strong> \uFF0C\u8FD4\u56DE\u5220\u9664\u540E\u6570\u7EC4\u7684\u65B0\u957F\u5EA6\u3002\u5143\u7D20\u7684 <strong>\u76F8\u5BF9\u987A\u5E8F</strong> \u5E94\u8BE5\u4FDD\u6301 <strong>\u4E00\u81F4</strong> \u3002\u7136\u540E\u8FD4\u56DE <code>nums</code> \u4E2D\u552F\u4E00\u5143\u7D20\u7684\u4E2A\u6570\u3002</p>

<p>\u8003\u8651 <code>nums</code> \u7684\u552F\u4E00\u5143\u7D20\u7684\u6570\u91CF\u4E3A <code>k</code> \uFF0C\u4F60\u9700\u8981\u505A\u4EE5\u4E0B\u4E8B\u60C5\u786E\u4FDD\u4F60\u7684\u9898\u89E3\u53EF\u4EE5\u88AB\u901A\u8FC7\uFF1A</p>

<ul>
	<li>\u66F4\u6539\u6570\u7EC4 <code>nums</code> \uFF0C\u4F7F <code>nums</code> \u7684\u524D <code>k</code> \u4E2A\u5143\u7D20\u5305\u542B\u552F\u4E00\u5143\u7D20\uFF0C\u5E76\u6309\u7167\u5B83\u4EEC\u6700\u521D\u5728 <code>nums</code> \u4E2D\u51FA\u73B0\u7684\u987A\u5E8F\u6392\u5217\u3002<code>nums</code>&nbsp;\u7684\u5176\u4F59\u5143\u7D20\u4E0E <code>nums</code> \u7684\u5927\u5C0F\u4E0D\u91CD\u8981\u3002</li>
	<li>\u8FD4\u56DE <code>k</code>&nbsp;\u3002</li>
</ul>

<p><strong>\u5224\u9898\u6807\u51C6:</strong></p>

<p>\u7CFB\u7EDF\u4F1A\u7528\u4E0B\u9762\u7684\u4EE3\u7801\u6765\u6D4B\u8BD5\u4F60\u7684\u9898\u89E3:</p>

<pre>
int[] nums = [...]; // \u8F93\u5165\u6570\u7EC4
int[] expectedNums = [...]; // \u957F\u5EA6\u6B63\u786E\u7684\u671F\u671B\u7B54\u6848

int k = removeDuplicates(nums); // \u8C03\u7528

assert k == expectedNums.length;
for (int i = 0; i &lt; k; i++) {
    assert nums[i] == expectedNums[i];
}</pre>

<p>\u5982\u679C\u6240\u6709\u65AD\u8A00\u90FD\u901A\u8FC7\uFF0C\u90A3\u4E48\u60A8\u7684\u9898\u89E3\u5C06\u88AB <strong>\u901A\u8FC7</strong>\u3002</p>

<p>&nbsp;</p>

<p><strong class="example">\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [1,1,2]
<strong>\u8F93\u51FA\uFF1A</strong>2, nums = [1,2,_]
<strong>\u89E3\u91CA\uFF1A</strong>\u51FD\u6570\u5E94\u8BE5\u8FD4\u56DE\u65B0\u7684\u957F\u5EA6 <strong><code>2</code></strong> \uFF0C\u5E76\u4E14\u539F\u6570\u7EC4 <em>nums </em>\u7684\u524D\u4E24\u4E2A\u5143\u7D20\u88AB\u4FEE\u6539\u4E3A <strong><code>1</code></strong>, <strong><code>2 </code></strong><code>\u3002</code>\u4E0D\u9700\u8981\u8003\u8651\u6570\u7EC4\u4E2D\u8D85\u51FA\u65B0\u957F\u5EA6\u540E\u9762\u7684\u5143\u7D20\u3002
</pre>

<p><strong class="example">\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [0,0,1,1,1,2,2,3,3,4]
<strong>\u8F93\u51FA\uFF1A</strong>5, nums = [0,1,2,3,4]
<strong>\u89E3\u91CA\uFF1A</strong>\u51FD\u6570\u5E94\u8BE5\u8FD4\u56DE\u65B0\u7684\u957F\u5EA6 <strong><code>5</code></strong> \uFF0C \u5E76\u4E14\u539F\u6570\u7EC4 <em>nums </em>\u7684\u524D\u4E94\u4E2A\u5143\u7D20\u88AB\u4FEE\u6539\u4E3A <strong><code>0</code></strong>, <strong><code>1</code></strong>, <strong><code>2</code></strong>, <strong><code>3</code></strong>, <strong><code>4</code></strong> \u3002\u4E0D\u9700\u8981\u8003\u8651\u6570\u7EC4\u4E2D\u8D85\u51FA\u65B0\u957F\u5EA6\u540E\u9762\u7684\u5143\u7D20\u3002
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= nums.length &lt;= 3 * 10<sup>4</sup></code></li>
	<li><code>-10<sup>4</sup> &lt;= nums[i] &lt;= 10<sup>4</sup></code></li>
	<li><code>nums</code> \u5DF2\u6309 <strong>\u5347\u5E8F</strong> \u6392\u5217</li>
</ul>
`,isPlus:!1},{problemsName:" 27.\u79FB\u9664\u5143\u7D20",hardRate:"EASY",passRate:"59.16%",problemsUrl:"https://leetcode.cn/problems/remove-element/",solutionsUrl:"https://leetcode.cn/problems/remove-element/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A\u6570\u7EC4 <code>nums</code><em>\xA0</em>\u548C\u4E00\u4E2A\u503C <code>val</code>\uFF0C\u4F60\u9700\u8981 <strong><a href="https://baike.baidu.com/item/%E5%8E%9F%E5%9C%B0%E7%AE%97%E6%B3%95" target="_blank">\u539F\u5730</a></strong> \u79FB\u9664\u6240\u6709\u6570\u503C\u7B49\u4E8E\xA0<code>val</code><em>\xA0</em>\u7684\u5143\u7D20\uFF0C\u5E76\u8FD4\u56DE\u79FB\u9664\u540E\u6570\u7EC4\u7684\u65B0\u957F\u5EA6\u3002</p>

<p>\u4E0D\u8981\u4F7F\u7528\u989D\u5916\u7684\u6570\u7EC4\u7A7A\u95F4\uFF0C\u4F60\u5FC5\u987B\u4EC5\u4F7F\u7528 <code>O(1)</code> \u989D\u5916\u7A7A\u95F4\u5E76 <strong><a href="https://baike.baidu.com/item/%E5%8E%9F%E5%9C%B0%E7%AE%97%E6%B3%95" target="_blank">\u539F\u5730 </a>\u4FEE\u6539\u8F93\u5165\u6570\u7EC4</strong>\u3002</p>

<p>\u5143\u7D20\u7684\u987A\u5E8F\u53EF\u4EE5\u6539\u53D8\u3002\u4F60\u4E0D\u9700\u8981\u8003\u8651\u6570\u7EC4\u4E2D\u8D85\u51FA\u65B0\u957F\u5EA6\u540E\u9762\u7684\u5143\u7D20\u3002</p>

<p>\xA0</p>

<p><strong>\u8BF4\u660E:</strong></p>

<p>\u4E3A\u4EC0\u4E48\u8FD4\u56DE\u6570\u503C\u662F\u6574\u6570\uFF0C\u4F46\u8F93\u51FA\u7684\u7B54\u6848\u662F\u6570\u7EC4\u5462?</p>

<p>\u8BF7\u6CE8\u610F\uFF0C\u8F93\u5165\u6570\u7EC4\u662F\u4EE5<strong>\u300C\u5F15\u7528\u300D</strong>\u65B9\u5F0F\u4F20\u9012\u7684\uFF0C\u8FD9\u610F\u5473\u7740\u5728\u51FD\u6570\u91CC\u4FEE\u6539\u8F93\u5165\u6570\u7EC4\u5BF9\u4E8E\u8C03\u7528\u8005\u662F\u53EF\u89C1\u7684\u3002</p>

<p>\u4F60\u53EF\u4EE5\u60F3\u8C61\u5185\u90E8\u64CD\u4F5C\u5982\u4E0B:</p>

<pre>
// <strong>nums</strong> \u662F\u4EE5\u201C\u5F15\u7528\u201D\u65B9\u5F0F\u4F20\u9012\u7684\u3002\u4E5F\u5C31\u662F\u8BF4\uFF0C\u4E0D\u5BF9\u5B9E\u53C2\u4F5C\u4EFB\u4F55\u62F7\u8D1D
int len = removeElement(nums, val);

// \u5728\u51FD\u6570\u91CC\u4FEE\u6539\u8F93\u5165\u6570\u7EC4\u5BF9\u4E8E\u8C03\u7528\u8005\u662F\u53EF\u89C1\u7684\u3002
// \u6839\u636E\u4F60\u7684\u51FD\u6570\u8FD4\u56DE\u7684\u957F\u5EA6, \u5B83\u4F1A\u6253\u5370\u51FA\u6570\u7EC4\u4E2D<strong> \u8BE5\u957F\u5EA6\u8303\u56F4\u5185</strong> \u7684\u6240\u6709\u5143\u7D20\u3002
for (int i = 0; i < len; i++) {
\xA0 \xA0 print(nums[i]);
}
</pre>

<p>\xA0</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [3,2,2,3], val = 3
<strong>\u8F93\u51FA\uFF1A</strong>2, nums = [2,2]
<strong>\u89E3\u91CA\uFF1A</strong>\u51FD\u6570\u5E94\u8BE5\u8FD4\u56DE\u65B0\u7684\u957F\u5EA6 <strong>2</strong>, \u5E76\u4E14 nums<em> </em>\u4E2D\u7684\u524D\u4E24\u4E2A\u5143\u7D20\u5747\u4E3A <strong>2</strong>\u3002\u4F60\u4E0D\u9700\u8981\u8003\u8651\u6570\u7EC4\u4E2D\u8D85\u51FA\u65B0\u957F\u5EA6\u540E\u9762\u7684\u5143\u7D20\u3002\u4F8B\u5982\uFF0C\u51FD\u6570\u8FD4\u56DE\u7684\u65B0\u957F\u5EA6\u4E3A 2 \uFF0C\u800C nums = [2,2,3,3] \u6216 nums = [2,2,0,0]\uFF0C\u4E5F\u4F1A\u88AB\u89C6\u4F5C\u6B63\u786E\u7B54\u6848\u3002
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [0,1,2,2,3,0,4,2], val = 2
<strong>\u8F93\u51FA\uFF1A</strong>5, nums = [0,1,4,0,3]
<strong>\u89E3\u91CA\uFF1A</strong>\u51FD\u6570\u5E94\u8BE5\u8FD4\u56DE\u65B0\u7684\u957F\u5EA6 <strong><code>5</code></strong>, \u5E76\u4E14 nums \u4E2D\u7684\u524D\u4E94\u4E2A\u5143\u7D20\u4E3A <strong><code>0</code></strong>, <strong><code>1</code></strong>, <strong><code>3</code></strong>, <strong><code>0</code></strong>, <strong>4</strong>\u3002\u6CE8\u610F\u8FD9\u4E94\u4E2A\u5143\u7D20\u53EF\u4E3A\u4EFB\u610F\u987A\u5E8F\u3002\u4F60\u4E0D\u9700\u8981\u8003\u8651\u6570\u7EC4\u4E2D\u8D85\u51FA\u65B0\u957F\u5EA6\u540E\u9762\u7684\u5143\u7D20\u3002
</pre>

<p>\xA0</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>0 <= nums.length <= 100</code></li>
	<li><code>0 <= nums[i] <= 50</code></li>
	<li><code>0 <= val <= 100</code></li>
</ul>
`,isPlus:!1},{problemsName:" 28.\u627E\u51FA\u5B57\u7B26\u4E32\u4E2D\u7B2C\u4E00\u4E2A\u5339\u914D\u9879\u7684\u4E0B\u6807",hardRate:"MEDIUM",passRate:"42.52%",problemsUrl:"https://leetcode.cn/problems/find-the-index-of-the-first-occurrence-in-a-string/",solutionsUrl:"https://leetcode.cn/problems/find-the-index-of-the-first-occurrence-in-a-string/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E24\u4E2A\u5B57\u7B26\u4E32&nbsp;<code>haystack</code> \u548C <code>needle</code> \uFF0C\u8BF7\u4F60\u5728 <code>haystack</code> \u5B57\u7B26\u4E32\u4E2D\u627E\u51FA <code>needle</code> \u5B57\u7B26\u4E32\u7684\u7B2C\u4E00\u4E2A\u5339\u914D\u9879\u7684\u4E0B\u6807\uFF08\u4E0B\u6807\u4ECE 0 \u5F00\u59CB\uFF09\u3002\u5982\u679C&nbsp;<code>needle</code> \u4E0D\u662F <code>haystack</code> \u7684\u4E00\u90E8\u5206\uFF0C\u5219\u8FD4\u56DE&nbsp; <code>-1</code><strong> </strong>\u3002</p>

<p>&nbsp;</p>

<p><strong class="example">\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>haystack = "sadbutsad", needle = "sad"
<strong>\u8F93\u51FA\uFF1A</strong>0
<strong>\u89E3\u91CA\uFF1A</strong>"sad" \u5728\u4E0B\u6807 0 \u548C 6 \u5904\u5339\u914D\u3002
\u7B2C\u4E00\u4E2A\u5339\u914D\u9879\u7684\u4E0B\u6807\u662F 0 \uFF0C\u6240\u4EE5\u8FD4\u56DE 0 \u3002
</pre>

<p><strong class="example">\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>haystack = "leetcode", needle = "leeto"
<strong>\u8F93\u51FA\uFF1A</strong>-1
<strong>\u89E3\u91CA\uFF1A</strong>"leeto" \u6CA1\u6709\u5728 "leetcode" \u4E2D\u51FA\u73B0\uFF0C\u6240\u4EE5\u8FD4\u56DE -1 \u3002
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= haystack.length, needle.length &lt;= 10<sup>4</sup></code></li>
	<li><code>haystack</code> \u548C <code>needle</code> \u4EC5\u7531\u5C0F\u5199\u82F1\u6587\u5B57\u7B26\u7EC4\u6210</li>
</ul>
`,isPlus:!1},{problemsName:" 29.\u4E24\u6570\u76F8\u9664",hardRate:"MEDIUM",passRate:"22.22%",problemsUrl:"https://leetcode.cn/problems/divide-two-integers/",solutionsUrl:"https://leetcode.cn/problems/divide-two-integers/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E24\u4E2A\u6574\u6570\uFF0C\u88AB\u9664\u6570&nbsp;<code>dividend</code>&nbsp;\u548C\u9664\u6570&nbsp;<code>divisor</code>\u3002\u5C06\u4E24\u6570\u76F8\u9664\uFF0C\u8981\u6C42 <strong>\u4E0D\u4F7F\u7528</strong> \u4E58\u6CD5\u3001\u9664\u6CD5\u548C\u53D6\u4F59\u8FD0\u7B97\u3002</p>

<p>\u6574\u6570\u9664\u6CD5\u5E94\u8BE5\u5411\u96F6\u622A\u65AD\uFF0C\u4E5F\u5C31\u662F\u622A\u53BB\uFF08<code>truncate</code>\uFF09\u5176\u5C0F\u6570\u90E8\u5206\u3002\u4F8B\u5982\uFF0C<code>8.345</code> \u5C06\u88AB\u622A\u65AD\u4E3A <code>8</code> \uFF0C<code>-2.7335</code> \u5C06\u88AB\u622A\u65AD\u81F3 <code>-2</code> \u3002</p>

<p>\u8FD4\u56DE\u88AB\u9664\u6570&nbsp;<code>dividend</code>&nbsp;\u9664\u4EE5\u9664\u6570&nbsp;<code>divisor</code>&nbsp;\u5F97\u5230\u7684 <strong>\u5546</strong> \u3002</p>

<p><strong>\u6CE8\u610F\uFF1A</strong>\u5047\u8BBE\u6211\u4EEC\u7684\u73AF\u5883\u53EA\u80FD\u5B58\u50A8 <strong>32 \u4F4D</strong> \u6709\u7B26\u53F7\u6574\u6570\uFF0C\u5176\u6570\u503C\u8303\u56F4\u662F <code>[\u22122<sup>31</sup>,&nbsp; 2<sup>31&nbsp;</sup>\u2212 1]</code> \u3002\u672C\u9898\u4E2D\uFF0C\u5982\u679C\u5546 <strong>\u4E25\u683C\u5927\u4E8E</strong> <code>2<sup>31&nbsp;</sup>\u2212 1</code> \uFF0C\u5219\u8FD4\u56DE <code>2<sup>31&nbsp;</sup>\u2212 1</code> \uFF1B\u5982\u679C\u5546 <strong>\u4E25\u683C\u5C0F\u4E8E</strong> <code>-2<sup>31</sup></code> \uFF0C\u5219\u8FD4\u56DE <code>-2<sup>31</sup></code><sup> </sup>\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B&nbsp;1:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong> dividend = 10, divisor = 3
<strong>\u8F93\u51FA:</strong> 3
<strong>\u89E3\u91CA: </strong>10/3 = 3.33333.. \uFF0C\u5411\u96F6\u622A\u65AD\u540E\u5F97\u5230 3 \u3002</pre>

<p><strong>\u793A\u4F8B&nbsp;2:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong> dividend = 7, divisor = -3
<strong>\u8F93\u51FA:</strong> -2
<strong>\u89E3\u91CA:</strong> 7/-3 = -2.33333.. \uFF0C\u5411\u96F6\u622A\u65AD\u540E\u5F97\u5230 -2 \u3002</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>-2<sup>31</sup> &lt;= dividend, divisor &lt;= 2<sup>31</sup> - 1</code></li>
	<li><code>divisor != 0</code></li>
</ul>
`,isPlus:!1},{problemsName:" 30.\u4E32\u8054\u6240\u6709\u5355\u8BCD\u7684\u5B50\u4E32",hardRate:"HARD",passRate:"39.62%",problemsUrl:"https://leetcode.cn/problems/substring-with-concatenation-of-all-words/",solutionsUrl:"https://leetcode.cn/problems/substring-with-concatenation-of-all-words/solution",problemsDesc:`<p>\u7ED9\u5B9A\u4E00\u4E2A\u5B57\u7B26\u4E32&nbsp;<code>s</code><strong>&nbsp;</strong>\u548C\u4E00\u4E2A\u5B57\u7B26\u4E32\u6570\u7EC4&nbsp;<code>words</code><strong>\u3002</strong>&nbsp;<code>words</code>&nbsp;\u4E2D\u6240\u6709\u5B57\u7B26\u4E32 <strong>\u957F\u5EA6\u76F8\u540C</strong>\u3002</p>

<p>&nbsp;<code>s</code><strong>&nbsp;</strong>\u4E2D\u7684 <strong>\u4E32\u8054\u5B50\u4E32</strong> \u662F\u6307\u4E00\u4E2A\u5305\u542B&nbsp;&nbsp;<code>words</code>&nbsp;\u4E2D\u6240\u6709\u5B57\u7B26\u4E32\u4EE5\u4EFB\u610F\u987A\u5E8F\u6392\u5217\u8FDE\u63A5\u8D77\u6765\u7684\u5B50\u4E32\u3002</p>

<ul>
	<li>\u4F8B\u5982\uFF0C\u5982\u679C&nbsp;<code>words = ["ab","cd","ef"]</code>\uFF0C \u90A3\u4E48&nbsp;<code>"abcdef"</code>\uFF0C&nbsp;<code>"abefcd"</code>\uFF0C<code>"cdabef"</code>\uFF0C&nbsp;<code>"cdefab"</code>\uFF0C<code>"efabcd"</code>\uFF0C \u548C&nbsp;<code>"efcdab"</code> \u90FD\u662F\u4E32\u8054\u5B50\u4E32\u3002&nbsp;<code>"acdbef"</code> \u4E0D\u662F\u4E32\u8054\u5B50\u4E32\uFF0C\u56E0\u4E3A\u4ED6\u4E0D\u662F\u4EFB\u4F55&nbsp;<code>words</code>&nbsp;\u6392\u5217\u7684\u8FDE\u63A5\u3002</li>
</ul>

<p>\u8FD4\u56DE\u6240\u6709\u4E32\u8054\u5B57\u4E32\u5728&nbsp;<code>s</code><strong>&nbsp;</strong>\u4E2D\u7684\u5F00\u59CB\u7D22\u5F15\u3002\u4F60\u53EF\u4EE5\u4EE5 <strong>\u4EFB\u610F\u987A\u5E8F</strong> \u8FD4\u56DE\u7B54\u6848\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "barfoothefoobarman", words = ["foo","bar"]
<strong>\u8F93\u51FA\uFF1A</strong><code>[0,9]</code>
<strong>\u89E3\u91CA\uFF1A</strong>\u56E0\u4E3A words.length == 2 \u540C\u65F6 words[i].length == 3\uFF0C\u8FDE\u63A5\u7684\u5B50\u5B57\u7B26\u4E32\u7684\u957F\u5EA6\u5FC5\u987B\u4E3A 6\u3002
\u5B50\u4E32 "barfoo" \u5F00\u59CB\u4F4D\u7F6E\u662F 0\u3002\u5B83\u662F words \u4E2D\u4EE5 ["bar","foo"] \u987A\u5E8F\u6392\u5217\u7684\u8FDE\u63A5\u3002
\u5B50\u4E32 "foobar" \u5F00\u59CB\u4F4D\u7F6E\u662F 9\u3002\u5B83\u662F words \u4E2D\u4EE5 ["foo","bar"] \u987A\u5E8F\u6392\u5217\u7684\u8FDE\u63A5\u3002
\u8F93\u51FA\u987A\u5E8F\u65E0\u5173\u7D27\u8981\u3002\u8FD4\u56DE [9,0] \u4E5F\u662F\u53EF\u4EE5\u7684\u3002
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "wordgoodgoodgoodbestword", words = ["word","good","best","word"]
<code><strong>\u8F93\u51FA\uFF1A</strong>[]</code>
<strong>\u89E3\u91CA\uFF1A</strong>\u56E0\u4E3A<strong> </strong>words.length == 4 \u5E76\u4E14 words[i].length == 4\uFF0C\u6240\u4EE5\u4E32\u8054\u5B50\u4E32\u7684\u957F\u5EA6\u5FC5\u987B\u4E3A 16\u3002
s \u4E2D\u6CA1\u6709\u5B50\u4E32\u957F\u5EA6\u4E3A 16 \u5E76\u4E14\u7B49\u4E8E words \u7684\u4EFB\u4F55\u987A\u5E8F\u6392\u5217\u7684\u8FDE\u63A5\u3002
\u6240\u4EE5\u6211\u4EEC\u8FD4\u56DE\u4E00\u4E2A\u7A7A\u6570\u7EC4\u3002
</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "barfoofoobarthefoobarman", words = ["bar","foo","the"]
<strong>\u8F93\u51FA\uFF1A</strong>[6,9,12]
<strong>\u89E3\u91CA\uFF1A</strong>\u56E0\u4E3A words.length == 3 \u5E76\u4E14 words[i].length == 3\uFF0C\u6240\u4EE5\u4E32\u8054\u5B50\u4E32\u7684\u957F\u5EA6\u5FC5\u987B\u4E3A 9\u3002
\u5B50\u4E32 "foobarthe" \u5F00\u59CB\u4F4D\u7F6E\u662F 6\u3002\u5B83\u662F words \u4E2D\u4EE5 ["foo","bar","the"] \u987A\u5E8F\u6392\u5217\u7684\u8FDE\u63A5\u3002
\u5B50\u4E32 "barthefoo" \u5F00\u59CB\u4F4D\u7F6E\u662F 9\u3002\u5B83\u662F words \u4E2D\u4EE5 ["bar","the","foo"] \u987A\u5E8F\u6392\u5217\u7684\u8FDE\u63A5\u3002
\u5B50\u4E32 "thefoobar" \u5F00\u59CB\u4F4D\u7F6E\u662F 12\u3002\u5B83\u662F words \u4E2D\u4EE5 ["the","foo","bar"] \u987A\u5E8F\u6392\u5217\u7684\u8FDE\u63A5\u3002</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= s.length &lt;= 10<sup>4</sup></code></li>
	<li><code>1 &lt;= words.length &lt;= 5000</code></li>
	<li><code>1 &lt;= words[i].length &lt;= 30</code></li>
	<li><code>words[i]</code>&nbsp;\u548C&nbsp;<code>s</code> \u7531\u5C0F\u5199\u82F1\u6587\u5B57\u6BCD\u7EC4\u6210</li>
</ul>
`,isPlus:!1},{problemsName:" 31.\u4E0B\u4E00\u4E2A\u6392\u5217",hardRate:"MEDIUM",passRate:"38.34%",problemsUrl:"https://leetcode.cn/problems/next-permutation/",solutionsUrl:"https://leetcode.cn/problems/next-permutation/solution",problemsDesc:`<p>\u6574\u6570\u6570\u7EC4\u7684\u4E00\u4E2A <strong>\u6392\u5217</strong>&nbsp; \u5C31\u662F\u5C06\u5176\u6240\u6709\u6210\u5458\u4EE5\u5E8F\u5217\u6216\u7EBF\u6027\u987A\u5E8F\u6392\u5217\u3002</p>

<ul>
	<li>\u4F8B\u5982\uFF0C<code>arr = [1,2,3]</code> \uFF0C\u4EE5\u4E0B\u8FD9\u4E9B\u90FD\u53EF\u4EE5\u89C6\u4F5C <code>arr</code> \u7684\u6392\u5217\uFF1A<code>[1,2,3]</code>\u3001<code>[1,3,2]</code>\u3001<code>[3,1,2]</code>\u3001<code>[2,3,1]</code> \u3002</li>
</ul>

<p>\u6574\u6570\u6570\u7EC4\u7684 <strong>\u4E0B\u4E00\u4E2A\u6392\u5217</strong> \u662F\u6307\u5176\u6574\u6570\u7684\u4E0B\u4E00\u4E2A\u5B57\u5178\u5E8F\u66F4\u5927\u7684\u6392\u5217\u3002\u66F4\u6B63\u5F0F\u5730\uFF0C\u5982\u679C\u6570\u7EC4\u7684\u6240\u6709\u6392\u5217\u6839\u636E\u5176\u5B57\u5178\u987A\u5E8F\u4ECE\u5C0F\u5230\u5927\u6392\u5217\u5728\u4E00\u4E2A\u5BB9\u5668\u4E2D\uFF0C\u90A3\u4E48\u6570\u7EC4\u7684 <strong>\u4E0B\u4E00\u4E2A\u6392\u5217</strong> \u5C31\u662F\u5728\u8FD9\u4E2A\u6709\u5E8F\u5BB9\u5668\u4E2D\u6392\u5728\u5B83\u540E\u9762\u7684\u90A3\u4E2A\u6392\u5217\u3002\u5982\u679C\u4E0D\u5B58\u5728\u4E0B\u4E00\u4E2A\u66F4\u5927\u7684\u6392\u5217\uFF0C\u90A3\u4E48\u8FD9\u4E2A\u6570\u7EC4\u5FC5\u987B\u91CD\u6392\u4E3A\u5B57\u5178\u5E8F\u6700\u5C0F\u7684\u6392\u5217\uFF08\u5373\uFF0C\u5176\u5143\u7D20\u6309\u5347\u5E8F\u6392\u5217\uFF09\u3002</p>

<ul>
	<li>\u4F8B\u5982\uFF0C<code>arr = [1,2,3]</code> \u7684\u4E0B\u4E00\u4E2A\u6392\u5217\u662F <code>[1,3,2]</code> \u3002</li>
	<li>\u7C7B\u4F3C\u5730\uFF0C<code>arr = [2,3,1]</code> \u7684\u4E0B\u4E00\u4E2A\u6392\u5217\u662F <code>[3,1,2]</code> \u3002</li>
	<li>\u800C <code>arr = [3,2,1]</code> \u7684\u4E0B\u4E00\u4E2A\u6392\u5217\u662F <code>[1,2,3]</code> \uFF0C\u56E0\u4E3A <code>[3,2,1]</code> \u4E0D\u5B58\u5728\u4E00\u4E2A\u5B57\u5178\u5E8F\u66F4\u5927\u7684\u6392\u5217\u3002</li>
</ul>

<p>\u7ED9\u4F60\u4E00\u4E2A\u6574\u6570\u6570\u7EC4 <code>nums</code> \uFF0C\u627E\u51FA <code>nums</code> \u7684\u4E0B\u4E00\u4E2A\u6392\u5217\u3002</p>

<p>\u5FC5\u987B<strong><a href="https://baike.baidu.com/item/%E5%8E%9F%E5%9C%B0%E7%AE%97%E6%B3%95" target="_blank"> \u539F\u5730 </a></strong>\u4FEE\u6539\uFF0C\u53EA\u5141\u8BB8\u4F7F\u7528\u989D\u5916\u5E38\u6570\u7A7A\u95F4\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [1,2,3]
<strong>\u8F93\u51FA\uFF1A</strong>[1,3,2]
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [3,2,1]
<strong>\u8F93\u51FA\uFF1A</strong>[1,2,3]
</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [1,1,5]
<strong>\u8F93\u51FA\uFF1A</strong>[1,5,1]
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= nums.length &lt;= 100</code></li>
	<li><code>0 &lt;= nums[i] &lt;= 100</code></li>
</ul>
`,isPlus:!1},{problemsName:" 32.\u6700\u957F\u6709\u6548\u62EC\u53F7",hardRate:"HARD",passRate:"37.23%",problemsUrl:"https://leetcode.cn/problems/longest-valid-parentheses/",solutionsUrl:"https://leetcode.cn/problems/longest-valid-parentheses/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A\u53EA\u5305\u542B <code>'('</code>\xA0\u548C <code>')'</code>\xA0\u7684\u5B57\u7B26\u4E32\uFF0C\u627E\u51FA\u6700\u957F\u6709\u6548\uFF08\u683C\u5F0F\u6B63\u786E\u4E14\u8FDE\u7EED\uFF09\u62EC\u53F7\u5B50\u4E32\u7684\u957F\u5EA6\u3002</p>

<p>\xA0</p>

<div class="original__bRMd">
<div>
<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "(()"
<strong>\u8F93\u51FA\uFF1A</strong>2
<strong>\u89E3\u91CA\uFF1A</strong>\u6700\u957F\u6709\u6548\u62EC\u53F7\u5B50\u4E32\u662F "()"
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = ")()())"
<strong>\u8F93\u51FA\uFF1A</strong>4
<strong>\u89E3\u91CA\uFF1A</strong>\u6700\u957F\u6709\u6548\u62EC\u53F7\u5B50\u4E32\u662F "()()"
</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = ""
<strong>\u8F93\u51FA\uFF1A</strong>0
</pre>

<p>\xA0</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>0 <= s.length <= 3 * 10<sup>4</sup></code></li>
	<li><code>s[i]</code> \u4E3A <code>'('</code> \u6216 <code>')'</code></li>
</ul>
</div>
</div>
`,isPlus:!1},{problemsName:" 33.\u641C\u7D22\u65CB\u8F6C\u6392\u5E8F\u6570\u7EC4",hardRate:"MEDIUM",passRate:"43.81%",problemsUrl:"https://leetcode.cn/problems/search-in-rotated-sorted-array/",solutionsUrl:"https://leetcode.cn/problems/search-in-rotated-sorted-array/solution",problemsDesc:`<p>\u6574\u6570\u6570\u7EC4 <code>nums</code> \u6309\u5347\u5E8F\u6392\u5217\uFF0C\u6570\u7EC4\u4E2D\u7684\u503C <strong>\u4E92\u4E0D\u76F8\u540C</strong> \u3002</p>

<p>\u5728\u4F20\u9012\u7ED9\u51FD\u6570\u4E4B\u524D\uFF0C<code>nums</code> \u5728\u9884\u5148\u672A\u77E5\u7684\u67D0\u4E2A\u4E0B\u6807 <code>k</code>\uFF08<code>0 &lt;= k &lt; nums.length</code>\uFF09\u4E0A\u8FDB\u884C\u4E86 <strong>\u65CB\u8F6C</strong>\uFF0C\u4F7F\u6570\u7EC4\u53D8\u4E3A <code>[nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]]</code>\uFF08\u4E0B\u6807 <strong>\u4ECE 0 \u5F00\u59CB</strong> \u8BA1\u6570\uFF09\u3002\u4F8B\u5982\uFF0C <code>[0,1,2,4,5,6,7]</code> \u5728\u4E0B\u6807 <code>3</code> \u5904\u7ECF\u65CB\u8F6C\u540E\u53EF\u80FD\u53D8\u4E3A&nbsp;<code>[4,5,6,7,0,1,2]</code> \u3002</p>

<p>\u7ED9\u4F60 <strong>\u65CB\u8F6C\u540E</strong> \u7684\u6570\u7EC4 <code>nums</code> \u548C\u4E00\u4E2A\u6574\u6570 <code>target</code> \uFF0C\u5982\u679C <code>nums</code> \u4E2D\u5B58\u5728\u8FD9\u4E2A\u76EE\u6807\u503C <code>target</code> \uFF0C\u5219\u8FD4\u56DE\u5B83\u7684\u4E0B\u6807\uFF0C\u5426\u5219\u8FD4\u56DE&nbsp;<code>-1</code>&nbsp;\u3002</p>

<p>\u4F60\u5FC5\u987B\u8BBE\u8BA1\u4E00\u4E2A\u65F6\u95F4\u590D\u6742\u5EA6\u4E3A <code>O(log n)</code> \u7684\u7B97\u6CD5\u89E3\u51B3\u6B64\u95EE\u9898\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [<code>4,5,6,7,0,1,2]</code>, target = 0
<strong>\u8F93\u51FA\uFF1A</strong>4
</pre>

<p><strong>\u793A\u4F8B&nbsp;2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [<code>4,5,6,7,0,1,2]</code>, target = 3
<strong>\u8F93\u51FA\uFF1A</strong>-1</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [1], target = 0
<strong>\u8F93\u51FA\uFF1A</strong>-1
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= nums.length &lt;= 5000</code></li>
	<li><code>-10<sup>4</sup> &lt;= nums[i] &lt;= 10<sup>4</sup></code></li>
	<li><code>nums</code> \u4E2D\u7684\u6BCF\u4E2A\u503C\u90FD <strong>\u72EC\u4E00\u65E0\u4E8C</strong></li>
	<li>\u9898\u76EE\u6570\u636E\u4FDD\u8BC1 <code>nums</code> \u5728\u9884\u5148\u672A\u77E5\u7684\u67D0\u4E2A\u4E0B\u6807\u4E0A\u8FDB\u884C\u4E86\u65CB\u8F6C</li>
	<li><code>-10<sup>4</sup> &lt;= target &lt;= 10<sup>4</sup></code></li>
</ul>
`,isPlus:!1},{problemsName:" 34.\u5728\u6392\u5E8F\u6570\u7EC4\u4E2D\u67E5\u627E\u5143\u7D20\u7684\u7B2C\u4E00\u4E2A\u548C\u6700\u540E\u4E00\u4E2A\u4F4D\u7F6E",hardRate:"MEDIUM",passRate:"42.40%",problemsUrl:"https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/",solutionsUrl:"https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A\u6309\u7167\u975E\u9012\u51CF\u987A\u5E8F\u6392\u5217\u7684\u6574\u6570\u6570\u7EC4 <code>nums</code>\uFF0C\u548C\u4E00\u4E2A\u76EE\u6807\u503C <code>target</code>\u3002\u8BF7\u4F60\u627E\u51FA\u7ED9\u5B9A\u76EE\u6807\u503C\u5728\u6570\u7EC4\u4E2D\u7684\u5F00\u59CB\u4F4D\u7F6E\u548C\u7ED3\u675F\u4F4D\u7F6E\u3002</p>

<p>\u5982\u679C\u6570\u7EC4\u4E2D\u4E0D\u5B58\u5728\u76EE\u6807\u503C <code>target</code>\uFF0C\u8FD4\u56DE&nbsp;<code>[-1, -1]</code>\u3002</p>

<p>\u4F60\u5FC5\u987B\u8BBE\u8BA1\u5E76\u5B9E\u73B0\u65F6\u95F4\u590D\u6742\u5EA6\u4E3A&nbsp;<code>O(log n)</code>&nbsp;\u7684\u7B97\u6CD5\u89E3\u51B3\u6B64\u95EE\u9898\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [<code>5,7,7,8,8,10]</code>, target = 8
<strong>\u8F93\u51FA\uFF1A</strong>[3,4]</pre>

<p><strong>\u793A\u4F8B&nbsp;2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [<code>5,7,7,8,8,10]</code>, target = 6
<strong>\u8F93\u51FA\uFF1A</strong>[-1,-1]</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [], target = 0
<strong>\u8F93\u51FA\uFF1A</strong>[-1,-1]</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>0 &lt;= nums.length &lt;= 10<sup>5</sup></code></li>
	<li><code>-10<sup>9</sup>&nbsp;&lt;= nums[i]&nbsp;&lt;= 10<sup>9</sup></code></li>
	<li><code>nums</code>&nbsp;\u662F\u4E00\u4E2A\u975E\u9012\u51CF\u6570\u7EC4</li>
	<li><code>-10<sup>9</sup>&nbsp;&lt;= target&nbsp;&lt;= 10<sup>9</sup></code></li>
</ul>
`,isPlus:!1},{problemsName:" 35.\u641C\u7D22\u63D2\u5165\u4F4D\u7F6E",hardRate:"EASY",passRate:"45.05%",problemsUrl:"https://leetcode.cn/problems/search-insert-position/",solutionsUrl:"https://leetcode.cn/problems/search-insert-position/solution",problemsDesc:`<p>\u7ED9\u5B9A\u4E00\u4E2A\u6392\u5E8F\u6570\u7EC4\u548C\u4E00\u4E2A\u76EE\u6807\u503C\uFF0C\u5728\u6570\u7EC4\u4E2D\u627E\u5230\u76EE\u6807\u503C\uFF0C\u5E76\u8FD4\u56DE\u5176\u7D22\u5F15\u3002\u5982\u679C\u76EE\u6807\u503C\u4E0D\u5B58\u5728\u4E8E\u6570\u7EC4\u4E2D\uFF0C\u8FD4\u56DE\u5B83\u5C06\u4F1A\u88AB\u6309\u987A\u5E8F\u63D2\u5165\u7684\u4F4D\u7F6E\u3002</p>

<p>\u8BF7\u5FC5\u987B\u4F7F\u7528\u65F6\u95F4\u590D\u6742\u5EA6\u4E3A <code>O(log n)</code> \u7684\u7B97\u6CD5\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong> nums = [1,3,5,6], target = 5
<strong>\u8F93\u51FA:</strong> 2
</pre>

<p><strong>\u793A\u4F8B&nbsp;2:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong> nums = [1,3,5,6], target = 2
<strong>\u8F93\u51FA:</strong> 1
</pre>

<p><strong>\u793A\u4F8B 3:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong> nums = [1,3,5,6], target = 7
<strong>\u8F93\u51FA:</strong> 4
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A:</strong></p>

<ul>
	<li><code>1 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
	<li><code>-10<sup>4</sup> &lt;= nums[i] &lt;= 10<sup>4</sup></code></li>
	<li><code>nums</code> \u4E3A&nbsp;<strong>\u65E0\u91CD\u590D\u5143\u7D20&nbsp;</strong>\u7684&nbsp;<strong>\u5347\u5E8F&nbsp;</strong>\u6392\u5217\u6570\u7EC4</li>
	<li><code>-10<sup>4</sup> &lt;= target &lt;= 10<sup>4</sup></code></li>
</ul>
`,isPlus:!1},{problemsName:" 36.\u6709\u6548\u7684\u6570\u72EC",hardRate:"MEDIUM",passRate:"63.03%",problemsUrl:"https://leetcode.cn/problems/valid-sudoku/",solutionsUrl:"https://leetcode.cn/problems/valid-sudoku/solution",problemsDesc:`<p>\u8BF7\u4F60\u5224\u65AD\u4E00\u4E2A&nbsp;<code>9 x 9</code> \u7684\u6570\u72EC\u662F\u5426\u6709\u6548\u3002\u53EA\u9700\u8981<strong> \u6839\u636E\u4EE5\u4E0B\u89C4\u5219</strong> \uFF0C\u9A8C\u8BC1\u5DF2\u7ECF\u586B\u5165\u7684\u6570\u5B57\u662F\u5426\u6709\u6548\u5373\u53EF\u3002</p>

<ol>
	<li>\u6570\u5B57&nbsp;<code>1-9</code>&nbsp;\u5728\u6BCF\u4E00\u884C\u53EA\u80FD\u51FA\u73B0\u4E00\u6B21\u3002</li>
	<li>\u6570\u5B57&nbsp;<code>1-9</code>&nbsp;\u5728\u6BCF\u4E00\u5217\u53EA\u80FD\u51FA\u73B0\u4E00\u6B21\u3002</li>
	<li>\u6570\u5B57&nbsp;<code>1-9</code>&nbsp;\u5728\u6BCF\u4E00\u4E2A\u4EE5\u7C97\u5B9E\u7EBF\u5206\u9694\u7684&nbsp;<code>3x3</code>&nbsp;\u5BAB\u5185\u53EA\u80FD\u51FA\u73B0\u4E00\u6B21\u3002\uFF08\u8BF7\u53C2\u8003\u793A\u4F8B\u56FE\uFF09</li>
</ol>

<p>&nbsp;</p>

<p><strong>\u6CE8\u610F\uFF1A</strong></p>

<ul>
	<li>\u4E00\u4E2A\u6709\u6548\u7684\u6570\u72EC\uFF08\u90E8\u5206\u5DF2\u88AB\u586B\u5145\uFF09\u4E0D\u4E00\u5B9A\u662F\u53EF\u89E3\u7684\u3002</li>
	<li>\u53EA\u9700\u8981\u6839\u636E\u4EE5\u4E0A\u89C4\u5219\uFF0C\u9A8C\u8BC1\u5DF2\u7ECF\u586B\u5165\u7684\u6570\u5B57\u662F\u5426\u6709\u6548\u5373\u53EF\u3002</li>
	<li>\u7A7A\u767D\u683C\u7528&nbsp;<code>'.'</code>&nbsp;\u8868\u793A\u3002</li>
</ul>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>
<img src="https://assets.leetcode-cn.com/aliyun-lc-upload/uploads/2021/04/12/250px-sudoku-by-l2g-20050714svg.png" style="height:250px; width:250px" />
<pre>
<strong>\u8F93\u5165\uFF1A</strong>board = 
[["5","3",".",".","7",".",".",".","."]
,["6",".",".","1","9","5",".",".","."]
,[".","9","8",".",".",".",".","6","."]
,["8",".",".",".","6",".",".",".","3"]
,["4",".",".","8",".","3",".",".","1"]
,["7",".",".",".","2",".",".",".","6"]
,[".","6",".",".",".",".","2","8","."]
,[".",".",".","4","1","9",".",".","5"]
,[".",".",".",".","8",".",".","7","9"]]
<strong>\u8F93\u51FA\uFF1A</strong>true
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>board = 
[["8","3",".",".","7",".",".",".","."]
,["6",".",".","1","9","5",".",".","."]
,[".","9","8",".",".",".",".","6","."]
,["8",".",".",".","6",".",".",".","3"]
,["4",".",".","8",".","3",".",".","1"]
,["7",".",".",".","2",".",".",".","6"]
,[".","6",".",".",".",".","2","8","."]
,[".",".",".","4","1","9",".",".","5"]
,[".",".",".",".","8",".",".","7","9"]]
<strong>\u8F93\u51FA\uFF1A</strong>false
<strong>\u89E3\u91CA\uFF1A</strong>\u9664\u4E86\u7B2C\u4E00\u884C\u7684\u7B2C\u4E00\u4E2A\u6570\u5B57\u4ECE<strong> 5</strong> \u6539\u4E3A <strong>8 </strong>\u4EE5\u5916\uFF0C\u7A7A\u683C\u5185\u5176\u4ED6\u6570\u5B57\u5747\u4E0E \u793A\u4F8B1 \u76F8\u540C\u3002 \u4F46\u7531\u4E8E\u4F4D\u4E8E\u5DE6\u4E0A\u89D2\u7684 3x3 \u5BAB\u5185\u6709\u4E24\u4E2A 8 \u5B58\u5728, \u56E0\u6B64\u8FD9\u4E2A\u6570\u72EC\u662F\u65E0\u6548\u7684\u3002</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>board.length == 9</code></li>
	<li><code>board[i].length == 9</code></li>
	<li><code>board[i][j]</code> \u662F\u4E00\u4F4D\u6570\u5B57\uFF08<code>1-9</code>\uFF09\u6216\u8005 <code>'.'</code></li>
</ul>
`,isPlus:!1},{problemsName:" 37.\u89E3\u6570\u72EC",hardRate:"HARD",passRate:"67.56%",problemsUrl:"https://leetcode.cn/problems/sudoku-solver/",solutionsUrl:"https://leetcode.cn/problems/sudoku-solver/solution",problemsDesc:`<p>\u7F16\u5199\u4E00\u4E2A\u7A0B\u5E8F\uFF0C\u901A\u8FC7\u586B\u5145\u7A7A\u683C\u6765\u89E3\u51B3\u6570\u72EC\u95EE\u9898\u3002</p>

<p>\u6570\u72EC\u7684\u89E3\u6CD5\u9700<strong> \u9075\u5FAA\u5982\u4E0B\u89C4\u5219</strong>\uFF1A</p>

<ol>
	<li>\u6570\u5B57&nbsp;<code>1-9</code>&nbsp;\u5728\u6BCF\u4E00\u884C\u53EA\u80FD\u51FA\u73B0\u4E00\u6B21\u3002</li>
	<li>\u6570\u5B57&nbsp;<code>1-9</code>&nbsp;\u5728\u6BCF\u4E00\u5217\u53EA\u80FD\u51FA\u73B0\u4E00\u6B21\u3002</li>
	<li>\u6570\u5B57&nbsp;<code>1-9</code>&nbsp;\u5728\u6BCF\u4E00\u4E2A\u4EE5\u7C97\u5B9E\u7EBF\u5206\u9694\u7684&nbsp;<code>3x3</code>&nbsp;\u5BAB\u5185\u53EA\u80FD\u51FA\u73B0\u4E00\u6B21\u3002\uFF08\u8BF7\u53C2\u8003\u793A\u4F8B\u56FE\uFF09</li>
</ol>

<p>\u6570\u72EC\u90E8\u5206\u7A7A\u683C\u5185\u5DF2\u586B\u5165\u4E86\u6570\u5B57\uFF0C\u7A7A\u767D\u683C\u7528&nbsp;<code>'.'</code>&nbsp;\u8868\u793A\u3002</p>

<p>&nbsp;</p>

<div class="top-view__1vxA">
<div class="original__bRMd">
<div>
<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>
<img src="https://assets.leetcode-cn.com/aliyun-lc-upload/uploads/2021/04/12/250px-sudoku-by-l2g-20050714svg.png" style="height:250px; width:250px" />
<pre>
<strong>\u8F93\u5165\uFF1A</strong>board = [["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]
<strong>\u8F93\u51FA\uFF1A</strong>[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]
<strong>\u89E3\u91CA\uFF1A</strong>\u8F93\u5165\u7684\u6570\u72EC\u5982\u4E0A\u56FE\u6240\u793A\uFF0C\u552F\u4E00\u6709\u6548\u7684\u89E3\u51B3\u65B9\u6848\u5982\u4E0B\u6240\u793A\uFF1A

<img src=" https://assets.leetcode-cn.com/aliyun-lc-upload/uploads/2021/04/12/250px-sudoku-by-l2g-20050714_solutionsvg.png" style="height:250px; width:250px" />
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>board.length == 9</code></li>
	<li><code>board[i].length == 9</code></li>
	<li><code>board[i][j]</code> \u662F\u4E00\u4F4D\u6570\u5B57\u6216\u8005 <code>'.'</code></li>
	<li>\u9898\u76EE\u6570\u636E <strong>\u4FDD\u8BC1</strong> \u8F93\u5165\u6570\u72EC\u4EC5\u6709\u4E00\u4E2A\u89E3</li>
</ul>
</div>
</div>
</div>
`,isPlus:!1},{problemsName:" 38.\u5916\u89C2\u6570\u5217",hardRate:"MEDIUM",passRate:"60.36%",problemsUrl:"https://leetcode.cn/problems/count-and-say/",solutionsUrl:"https://leetcode.cn/problems/count-and-say/solution",problemsDesc:`<p>\u7ED9\u5B9A\u4E00\u4E2A\u6B63\u6574\u6570 <code>n</code> \uFF0C\u8F93\u51FA\u5916\u89C2\u6570\u5217\u7684\u7B2C <code>n</code> \u9879\u3002</p>

<p>\u300C\u5916\u89C2\u6570\u5217\u300D\u662F\u4E00\u4E2A\u6574\u6570\u5E8F\u5217\uFF0C\u4ECE\u6570\u5B57 1 \u5F00\u59CB\uFF0C\u5E8F\u5217\u4E2D\u7684\u6BCF\u4E00\u9879\u90FD\u662F\u5BF9\u524D\u4E00\u9879\u7684\u63CF\u8FF0\u3002</p>

<p>\u4F60\u53EF\u4EE5\u5C06\u5176\u89C6\u4F5C\u662F\u7531\u9012\u5F52\u516C\u5F0F\u5B9A\u4E49\u7684\u6570\u5B57\u5B57\u7B26\u4E32\u5E8F\u5217\uFF1A</p>

<ul>
	<li><code>countAndSay(1) = "1"</code></li>
	<li><code>countAndSay(n)</code> \u662F\u5BF9 <code>countAndSay(n-1)</code> \u7684\u63CF\u8FF0\uFF0C\u7136\u540E\u8F6C\u6362\u6210\u53E6\u4E00\u4E2A\u6570\u5B57\u5B57\u7B26\u4E32\u3002</li>
</ul>

<p>\u524D\u4E94\u9879\u5982\u4E0B\uFF1A</p>

<pre>
1.     1
2.     11
3.     21
4.     1211
5.     111221
\u7B2C\u4E00\u9879\u662F\u6570\u5B57 1 
\u63CF\u8FF0\u524D\u4E00\u9879\uFF0C\u8FD9\u4E2A\u6570\u662F <code>1</code> \u5373 \u201C \u4E00 \u4E2A 1 \u201D\uFF0C\u8BB0\u4F5C <code>"11"
</code>\u63CF\u8FF0\u524D\u4E00\u9879\uFF0C\u8FD9\u4E2A\u6570\u662F <code>11</code> \u5373 \u201C \u4E8C \u4E2A 1 \u201D \uFF0C\u8BB0\u4F5C <code>"21"
</code>\u63CF\u8FF0\u524D\u4E00\u9879\uFF0C\u8FD9\u4E2A\u6570\u662F <code>21</code> \u5373 \u201C \u4E00 \u4E2A 2 + \u4E00 \u4E2A 1 \u201D \uFF0C\u8BB0\u4F5C "<code>1211"
</code>\u63CF\u8FF0\u524D\u4E00\u9879\uFF0C\u8FD9\u4E2A\u6570\u662F <code>1211</code> \u5373 \u201C \u4E00 \u4E2A 1 + \u4E00 \u4E2A 2 + \u4E8C \u4E2A 1 \u201D \uFF0C\u8BB0\u4F5C "<code>111221"</code>
</pre>

<p>\u8981 <strong>\u63CF\u8FF0</strong> \u4E00\u4E2A\u6570\u5B57\u5B57\u7B26\u4E32\uFF0C\u9996\u5148\u8981\u5C06\u5B57\u7B26\u4E32\u5206\u5272\u4E3A <strong>\u6700\u5C0F</strong> \u6570\u91CF\u7684\u7EC4\uFF0C\u6BCF\u4E2A\u7EC4\u90FD\u7531\u8FDE\u7EED\u7684\u6700\u591A <strong>\u76F8\u540C\u5B57\u7B26</strong> \u7EC4\u6210\u3002\u7136\u540E\u5BF9\u4E8E\u6BCF\u4E2A\u7EC4\uFF0C\u5148\u63CF\u8FF0\u5B57\u7B26\u7684\u6570\u91CF\uFF0C\u7136\u540E\u63CF\u8FF0\u5B57\u7B26\uFF0C\u5F62\u6210\u4E00\u4E2A\u63CF\u8FF0\u7EC4\u3002\u8981\u5C06\u63CF\u8FF0\u8F6C\u6362\u4E3A\u6570\u5B57\u5B57\u7B26\u4E32\uFF0C\u5148\u5C06\u6BCF\u7EC4\u4E2D\u7684\u5B57\u7B26\u6570\u91CF\u7528\u6570\u5B57\u66FF\u6362\uFF0C\u518D\u5C06\u6240\u6709\u63CF\u8FF0\u7EC4\u8FDE\u63A5\u8D77\u6765\u3002</p>

<p>\u4F8B\u5982\uFF0C\u6570\u5B57\u5B57\u7B26\u4E32 <code>"3322251"</code> \u7684\u63CF\u8FF0\u5982\u4E0B\u56FE\uFF1A</p>
<img alt="" src="https://pic.leetcode-cn.com/1629874763-TGmKUh-image.png" style="width: 581px; height: 172px;" />
<ul>
</ul>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>n = 1
<strong>\u8F93\u51FA\uFF1A</strong>"1"
<strong>\u89E3\u91CA\uFF1A</strong>\u8FD9\u662F\u4E00\u4E2A\u57FA\u672C\u6837\u4F8B\u3002
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>n = 4
<strong>\u8F93\u51FA\uFF1A</strong>"1211"
<strong>\u89E3\u91CA\uFF1A</strong>
countAndSay(1) = "1"
countAndSay(2) = \u8BFB "1" = \u4E00 \u4E2A 1 = "11"
countAndSay(3) = \u8BFB "11" = \u4E8C \u4E2A 1 = "21"
countAndSay(4) = \u8BFB "21" = \u4E00 \u4E2A 2 + \u4E00 \u4E2A 1 = "12" + "11" = "1211"
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= n &lt;= 30</code></li>
</ul>
`,isPlus:!1},{problemsName:" 39.\u7EC4\u5408\u603B\u548C",hardRate:"MEDIUM",passRate:"72.33%",problemsUrl:"https://leetcode.cn/problems/combination-sum/",solutionsUrl:"https://leetcode.cn/problems/combination-sum/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A <strong>\u65E0\u91CD\u590D\u5143\u7D20</strong> \u7684\u6574\u6570\u6570\u7EC4&nbsp;<code>candidates</code> \u548C\u4E00\u4E2A\u76EE\u6807\u6574\u6570&nbsp;<code>target</code>&nbsp;\uFF0C\u627E\u51FA&nbsp;<code>candidates</code>&nbsp;\u4E2D\u53EF\u4EE5\u4F7F\u6570\u5B57\u548C\u4E3A\u76EE\u6807\u6570&nbsp;<code>target</code> \u7684 \u6240\u6709<em>&nbsp;</em><strong>\u4E0D\u540C\u7EC4\u5408</strong> \uFF0C\u5E76\u4EE5\u5217\u8868\u5F62\u5F0F\u8FD4\u56DE\u3002\u4F60\u53EF\u4EE5\u6309 <strong>\u4EFB\u610F\u987A\u5E8F</strong> \u8FD4\u56DE\u8FD9\u4E9B\u7EC4\u5408\u3002</p>

<p><code>candidates</code> \u4E2D\u7684 <strong>\u540C\u4E00\u4E2A</strong> \u6570\u5B57\u53EF\u4EE5 <strong>\u65E0\u9650\u5236\u91CD\u590D\u88AB\u9009\u53D6</strong> \u3002\u5982\u679C\u81F3\u5C11\u4E00\u4E2A\u6570\u5B57\u7684\u88AB\u9009\u6570\u91CF\u4E0D\u540C\uFF0C\u5219\u4E24\u79CD\u7EC4\u5408\u662F\u4E0D\u540C\u7684\u3002&nbsp;</p>

<p>\u5BF9\u4E8E\u7ED9\u5B9A\u7684\u8F93\u5165\uFF0C\u4FDD\u8BC1\u548C\u4E3A&nbsp;<code>target</code> \u7684\u4E0D\u540C\u7EC4\u5408\u6570\u5C11\u4E8E <code>150</code> \u4E2A\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B&nbsp;1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>candidates = <code>[2,3,6,7], </code>target = <code>7</code>
<strong>\u8F93\u51FA\uFF1A</strong>[[2,2,3],[7]]
<strong>\u89E3\u91CA\uFF1A</strong>
2 \u548C 3 \u53EF\u4EE5\u5F62\u6210\u4E00\u7EC4\u5019\u9009\uFF0C2 + 2 + 3 = 7 \u3002\u6CE8\u610F 2 \u53EF\u4EE5\u4F7F\u7528\u591A\u6B21\u3002
7 \u4E5F\u662F\u4E00\u4E2A\u5019\u9009\uFF0C 7 = 7 \u3002
\u4EC5\u6709\u8FD9\u4E24\u79CD\u7EC4\u5408\u3002</pre>

<p><strong>\u793A\u4F8B&nbsp;2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165: </strong>candidates = [2,3,5]<code>, </code>target = 8
<strong>\u8F93\u51FA: </strong>[[2,2,2,2],[2,3,3],[3,5]]</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165: </strong>candidates = <code>[2], </code>target = 1
<strong>\u8F93\u51FA: </strong>[]
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= candidates.length &lt;= 30</code></li>
	<li><code>2 &lt;= candidates[i] &lt;= 40</code></li>
	<li><code>candidates</code> \u7684\u6240\u6709\u5143\u7D20 <strong>\u4E92\u4E0D\u76F8\u540C</strong></li>
	<li><code>1 &lt;= target &lt;= 40</code></li>
</ul>
`,isPlus:!1},{problemsName:" 40.\u7EC4\u5408\u603B\u548C II",hardRate:"MEDIUM",passRate:"59.69%",problemsUrl:"https://leetcode.cn/problems/combination-sum-ii/",solutionsUrl:"https://leetcode.cn/problems/combination-sum-ii/solution",problemsDesc:`<p>\u7ED9\u5B9A\u4E00\u4E2A\u5019\u9009\u4EBA\u7F16\u53F7\u7684\u96C6\u5408&nbsp;<code>candidates</code>&nbsp;\u548C\u4E00\u4E2A\u76EE\u6807\u6570&nbsp;<code>target</code>&nbsp;\uFF0C\u627E\u51FA&nbsp;<code>candidates</code>&nbsp;\u4E2D\u6240\u6709\u53EF\u4EE5\u4F7F\u6570\u5B57\u548C\u4E3A&nbsp;<code>target</code>&nbsp;\u7684\u7EC4\u5408\u3002</p>

<p><code>candidates</code>&nbsp;\u4E2D\u7684\u6BCF\u4E2A\u6570\u5B57\u5728\u6BCF\u4E2A\u7EC4\u5408\u4E2D\u53EA\u80FD\u4F7F\u7528&nbsp;<strong>\u4E00\u6B21</strong>&nbsp;\u3002</p>

<p><strong>\u6CE8\u610F\uFF1A</strong>\u89E3\u96C6\u4E0D\u80FD\u5305\u542B\u91CD\u590D\u7684\u7EC4\u5408\u3002&nbsp;</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B&nbsp;1:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong> candidates =&nbsp;<code>[10,1,2,7,6,1,5]</code>, target =&nbsp;<code>8</code>,
<strong>\u8F93\u51FA:</strong>
[
[1,1,6],
[1,2,5],
[1,7],
[2,6]
]</pre>

<p><strong>\u793A\u4F8B&nbsp;2:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong> candidates =&nbsp;[2,5,2,1,2], target =&nbsp;5,
<strong>\u8F93\u51FA:</strong>
[
[1,2,2],
[5]
]</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A:</strong></p>

<ul>
	<li><code>1 &lt;=&nbsp;candidates.length &lt;= 100</code></li>
	<li><code>1 &lt;=&nbsp;candidates[i] &lt;= 50</code></li>
	<li><code>1 &lt;= target &lt;= 30</code></li>
</ul>
`,isPlus:!1},{problemsName:" 41.\u7F3A\u5931\u7684\u7B2C\u4E00\u4E2A\u6B63\u6570",hardRate:"HARD",passRate:"43.09%",problemsUrl:"https://leetcode.cn/problems/first-missing-positive/",solutionsUrl:"https://leetcode.cn/problems/first-missing-positive/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A\u672A\u6392\u5E8F\u7684\u6574\u6570\u6570\u7EC4 <code>nums</code> \uFF0C\u8BF7\u4F60\u627E\u51FA\u5176\u4E2D\u6CA1\u6709\u51FA\u73B0\u7684\u6700\u5C0F\u7684\u6B63\u6574\u6570\u3002</p>
\u8BF7\u4F60\u5B9E\u73B0\u65F6\u95F4\u590D\u6742\u5EA6\u4E3A <code>O(n)</code> \u5E76\u4E14\u53EA\u4F7F\u7528\u5E38\u6570\u7EA7\u522B\u989D\u5916\u7A7A\u95F4\u7684\u89E3\u51B3\u65B9\u6848\u3002

<p>\xA0</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [1,2,0]
<strong>\u8F93\u51FA\uFF1A</strong>3
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [3,4,-1,1]
<strong>\u8F93\u51FA\uFF1A</strong>2
</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [7,8,9,11,12]
<strong>\u8F93\u51FA\uFF1A</strong>1
</pre>

<p>\xA0</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 <= nums.length <= 5 * 10<sup>5</sup></code></li>
	<li><code>-2<sup>31</sup> <= nums[i] <= 2<sup>31</sup> - 1</code></li>
</ul>
`,isPlus:!1},{problemsName:" 42.\u63A5\u96E8\u6C34",hardRate:"HARD",passRate:"62.78%",problemsUrl:"https://leetcode.cn/problems/trapping-rain-water/",solutionsUrl:"https://leetcode.cn/problems/trapping-rain-water/solution",problemsDesc:`<p>\u7ED9\u5B9A&nbsp;<code>n</code> \u4E2A\u975E\u8D1F\u6574\u6570\u8868\u793A\u6BCF\u4E2A\u5BBD\u5EA6\u4E3A <code>1</code> \u7684\u67F1\u5B50\u7684\u9AD8\u5EA6\u56FE\uFF0C\u8BA1\u7B97\u6309\u6B64\u6392\u5217\u7684\u67F1\u5B50\uFF0C\u4E0B\u96E8\u4E4B\u540E\u80FD\u63A5\u591A\u5C11\u96E8\u6C34\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<p><img src="https://assets.leetcode-cn.com/aliyun-lc-upload/uploads/2018/10/22/rainwatertrap.png" style="height: 161px; width: 412px;" /></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>height = [0,1,0,2,1,0,1,3,2,1,2,1]
<strong>\u8F93\u51FA\uFF1A</strong>6
<strong>\u89E3\u91CA\uFF1A</strong>\u4E0A\u9762\u662F\u7531\u6570\u7EC4 [0,1,0,2,1,0,1,3,2,1,2,1] \u8868\u793A\u7684\u9AD8\u5EA6\u56FE\uFF0C\u5728\u8FD9\u79CD\u60C5\u51B5\u4E0B\uFF0C\u53EF\u4EE5\u63A5 6 \u4E2A\u5355\u4F4D\u7684\u96E8\u6C34\uFF08\u84DD\u8272\u90E8\u5206\u8868\u793A\u96E8\u6C34\uFF09\u3002 
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>height = [4,2,0,3,2,5]
<strong>\u8F93\u51FA\uFF1A</strong>9
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>n == height.length</code></li>
	<li><code>1 &lt;= n &lt;= 2 * 10<sup>4</sup></code></li>
	<li><code>0 &lt;= height[i] &lt;= 10<sup>5</sup></code></li>
</ul>
`,isPlus:!1},{problemsName:" 43.\u5B57\u7B26\u4E32\u76F8\u4E58",hardRate:"MEDIUM",passRate:"44.39%",problemsUrl:"https://leetcode.cn/problems/multiply-strings/",solutionsUrl:"https://leetcode.cn/problems/multiply-strings/solution",problemsDesc:`<p>\u7ED9\u5B9A\u4E24\u4E2A\u4EE5\u5B57\u7B26\u4E32\u5F62\u5F0F\u8868\u793A\u7684\u975E\u8D1F\u6574\u6570&nbsp;<code>num1</code>&nbsp;\u548C&nbsp;<code>num2</code>\uFF0C\u8FD4\u56DE&nbsp;<code>num1</code>&nbsp;\u548C&nbsp;<code>num2</code>&nbsp;\u7684\u4E58\u79EF\uFF0C\u5B83\u4EEC\u7684\u4E58\u79EF\u4E5F\u8868\u793A\u4E3A\u5B57\u7B26\u4E32\u5F62\u5F0F\u3002</p>

<p><strong>\u6CE8\u610F\uFF1A</strong>\u4E0D\u80FD\u4F7F\u7528\u4EFB\u4F55\u5185\u7F6E\u7684 BigInteger \u5E93\u6216\u76F4\u63A5\u5C06\u8F93\u5165\u8F6C\u6362\u4E3A\u6574\u6570\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong> num1 = "2", num2 = "3"
<strong>\u8F93\u51FA:</strong> "6"</pre>

<p><strong>\u793A\u4F8B&nbsp;2:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong> num1 = "123", num2 = "456"
<strong>\u8F93\u51FA:</strong> "56088"</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= num1.length, num2.length &lt;= 200</code></li>
	<li><code>num1</code>&nbsp;\u548C <code>num2</code>&nbsp;\u53EA\u80FD\u7531\u6570\u5B57\u7EC4\u6210\u3002</li>
	<li><code>num1</code>&nbsp;\u548C <code>num2</code>&nbsp;\u90FD\u4E0D\u5305\u542B\u4EFB\u4F55\u524D\u5BFC\u96F6\uFF0C\u9664\u4E86\u6570\u5B570\u672C\u8EAB\u3002</li>
</ul>
`,isPlus:!1},{problemsName:" 44.\u901A\u914D\u7B26\u5339\u914D",hardRate:"HARD",passRate:"33.80%",problemsUrl:"https://leetcode.cn/problems/wildcard-matching/",solutionsUrl:"https://leetcode.cn/problems/wildcard-matching/solution",problemsDesc:`<div class="title__3Vvk">\u7ED9\u4F60\u4E00\u4E2A\u8F93\u5165\u5B57\u7B26\u4E32 (<code>s</code>) \u548C\u4E00\u4E2A\u5B57\u7B26\u6A21\u5F0F (<code>p</code>) \uFF0C\u8BF7\u4F60\u5B9E\u73B0\u4E00\u4E2A\u652F\u6301 <code>'?'</code> \u548C <code>'*'</code> \u5339\u914D\u89C4\u5219\u7684\u901A\u914D\u7B26\u5339\u914D\uFF1A</div>

<ul>
	<li class="title__3Vvk"><code>'?'</code> \u53EF\u4EE5\u5339\u914D\u4EFB\u4F55\u5355\u4E2A\u5B57\u7B26\u3002</li>
	<li class="title__3Vvk"><code>'*'</code> \u53EF\u4EE5\u5339\u914D\u4EFB\u610F\u5B57\u7B26\u5E8F\u5217\uFF08\u5305\u62EC\u7A7A\u5B57\u7B26\u5E8F\u5217\uFF09\u3002</li>
</ul>

<div class="original__bRMd">
<div>
<p>\u5224\u5B9A\u5339\u914D\u6210\u529F\u7684\u5145\u8981\u6761\u4EF6\u662F\uFF1A\u5B57\u7B26\u6A21\u5F0F\u5FC5\u987B\u80FD\u591F <strong>\u5B8C\u5168\u5339\u914D</strong> \u8F93\u5165\u5B57\u7B26\u4E32\uFF08\u800C\u4E0D\u662F\u90E8\u5206\u5339\u914D\uFF09\u3002</p>
</div>
</div>
&nbsp;

<p><strong class="example">\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "aa", p = "a"
<strong>\u8F93\u51FA\uFF1A</strong>false
<strong>\u89E3\u91CA\uFF1A</strong>"a" \u65E0\u6CD5\u5339\u914D "aa" \u6574\u4E2A\u5B57\u7B26\u4E32\u3002
</pre>

<p><strong class="example">\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "aa", p = "*"
<strong>\u8F93\u51FA\uFF1A</strong>true
<strong>\u89E3\u91CA\uFF1A</strong>'*' \u53EF\u4EE5\u5339\u914D\u4EFB\u610F\u5B57\u7B26\u4E32\u3002
</pre>

<p><strong class="example">\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>s = "cb", p = "?a"
<strong>\u8F93\u51FA\uFF1A</strong>false
<strong>\u89E3\u91CA\uFF1A</strong>'?' \u53EF\u4EE5\u5339\u914D 'c', \u4F46\u7B2C\u4E8C\u4E2A 'a' \u65E0\u6CD5\u5339\u914D 'b'\u3002
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>0 &lt;= s.length, p.length &lt;= 2000</code></li>
	<li><code>s</code> \u4EC5\u7531\u5C0F\u5199\u82F1\u6587\u5B57\u6BCD\u7EC4\u6210</li>
	<li><code>p</code> \u4EC5\u7531\u5C0F\u5199\u82F1\u6587\u5B57\u6BCD\u3001<code>'?'</code> \u6216 <code>'*'</code> \u7EC4\u6210</li>
</ul>
`,isPlus:!1},{problemsName:" 45.\u8DF3\u8DC3\u6E38\u620F II",hardRate:"MEDIUM",passRate:"45.13%",problemsUrl:"https://leetcode.cn/problems/jump-game-ii/",solutionsUrl:"https://leetcode.cn/problems/jump-game-ii/solution",problemsDesc:`<p>\u7ED9\u5B9A\u4E00\u4E2A\u957F\u5EA6\u4E3A <code>n</code> \u7684 <strong>0 \u7D22\u5F15</strong>\u6574\u6570\u6570\u7EC4 <code>nums</code>\u3002\u521D\u59CB\u4F4D\u7F6E\u4E3A <code>nums[0]</code>\u3002</p>

<p>\u6BCF\u4E2A\u5143\u7D20 <code>nums[i]</code> \u8868\u793A\u4ECE\u7D22\u5F15 <code>i</code> \u5411\u524D\u8DF3\u8F6C\u7684\u6700\u5927\u957F\u5EA6\u3002\u6362\u53E5\u8BDD\u8BF4\uFF0C\u5982\u679C\u4F60\u5728 <code>nums[i]</code> \u5904\uFF0C\u4F60\u53EF\u4EE5\u8DF3\u8F6C\u5230\u4EFB\u610F <code>nums[i + j]</code> \u5904:</p>

<ul>
	<li><code>0 &lt;= j &lt;= nums[i]</code>&nbsp;</li>
	<li><code>i + j &lt; n</code></li>
</ul>

<p>\u8FD4\u56DE\u5230\u8FBE&nbsp;<code>nums[n - 1]</code> \u7684\u6700\u5C0F\u8DF3\u8DC3\u6B21\u6570\u3002\u751F\u6210\u7684\u6D4B\u8BD5\u7528\u4F8B\u53EF\u4EE5\u5230\u8FBE <code>nums[n - 1]</code>\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong> nums = [2,3,1,1,4]
<strong>\u8F93\u51FA:</strong> 2
<strong>\u89E3\u91CA:</strong> \u8DF3\u5230\u6700\u540E\u4E00\u4E2A\u4F4D\u7F6E\u7684\u6700\u5C0F\u8DF3\u8DC3\u6570\u662F <code>2</code>\u3002
&nbsp;    \u4ECE\u4E0B\u6807\u4E3A 0 \u8DF3\u5230\u4E0B\u6807\u4E3A 1 \u7684\u4F4D\u7F6E\uFF0C\u8DF3&nbsp;<code>1</code>&nbsp;\u6B65\uFF0C\u7136\u540E\u8DF3&nbsp;<code>3</code>&nbsp;\u6B65\u5230\u8FBE\u6570\u7EC4\u7684\u6700\u540E\u4E00\u4E2A\u4F4D\u7F6E\u3002
</pre>

<p><strong>\u793A\u4F8B 2:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong> nums = [2,3,0,1,4]
<strong>\u8F93\u51FA:</strong> 2
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A:</strong></p>

<ul>
	<li><code>1 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
	<li><code>0 &lt;= nums[i] &lt;= 1000</code></li>
	<li>\u9898\u76EE\u4FDD\u8BC1\u53EF\u4EE5\u5230\u8FBE&nbsp;<code>nums[n-1]</code></li>
</ul>
`,isPlus:!1},{problemsName:" 46.\u5168\u6392\u5217",hardRate:"MEDIUM",passRate:"78.89%",problemsUrl:"https://leetcode.cn/problems/permutations/",solutionsUrl:"https://leetcode.cn/problems/permutations/solution",problemsDesc:`<p>\u7ED9\u5B9A\u4E00\u4E2A\u4E0D\u542B\u91CD\u590D\u6570\u5B57\u7684\u6570\u7EC4 <code>nums</code> \uFF0C\u8FD4\u56DE\u5176 <em>\u6240\u6709\u53EF\u80FD\u7684\u5168\u6392\u5217</em> \u3002\u4F60\u53EF\u4EE5 <strong>\u6309\u4EFB\u610F\u987A\u5E8F</strong> \u8FD4\u56DE\u7B54\u6848\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [1,2,3]
<strong>\u8F93\u51FA\uFF1A</strong>[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [0,1]
<strong>\u8F93\u51FA\uFF1A</strong>[[0,1],[1,0]]
</pre>

<p><strong>\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [1]
<strong>\u8F93\u51FA\uFF1A</strong>[[1]]
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= nums.length &lt;= 6</code></li>
	<li><code>-10 &lt;= nums[i] &lt;= 10</code></li>
	<li><code>nums</code> \u4E2D\u7684\u6240\u6709\u6574\u6570 <strong>\u4E92\u4E0D\u76F8\u540C</strong></li>
</ul>
`,isPlus:!1},{problemsName:" 47.\u5168\u6392\u5217 II",hardRate:"MEDIUM",passRate:"65.55%",problemsUrl:"https://leetcode.cn/problems/permutations-ii/",solutionsUrl:"https://leetcode.cn/problems/permutations-ii/solution",problemsDesc:`<p>\u7ED9\u5B9A\u4E00\u4E2A\u53EF\u5305\u542B\u91CD\u590D\u6570\u5B57\u7684\u5E8F\u5217 <code>nums</code> \uFF0C<em><strong>\u6309\u4EFB\u610F\u987A\u5E8F</strong></em> \u8FD4\u56DE\u6240\u6709\u4E0D\u91CD\u590D\u7684\u5168\u6392\u5217\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [1,1,2]
<strong>\u8F93\u51FA\uFF1A</strong>
[[1,1,2],
 [1,2,1],
 [2,1,1]]
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>nums = [1,2,3]
<strong>\u8F93\u51FA\uFF1A</strong>[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= nums.length &lt;= 8</code></li>
	<li><code>-10 &lt;= nums[i] &lt;= 10</code></li>
</ul>
`,isPlus:!1},{problemsName:" 48.\u65CB\u8F6C\u56FE\u50CF",hardRate:"MEDIUM",passRate:"74.77%",problemsUrl:"https://leetcode.cn/problems/rotate-image/",solutionsUrl:"https://leetcode.cn/problems/rotate-image/solution",problemsDesc:`<p>\u7ED9\u5B9A\u4E00\u4E2A <em>n&nbsp;</em>\xD7&nbsp;<em>n</em> \u7684\u4E8C\u7EF4\u77E9\u9635&nbsp;<code>matrix</code> \u8868\u793A\u4E00\u4E2A\u56FE\u50CF\u3002\u8BF7\u4F60\u5C06\u56FE\u50CF\u987A\u65F6\u9488\u65CB\u8F6C 90 \u5EA6\u3002</p>

<p>\u4F60\u5FC5\u987B\u5728<strong><a href="https://baike.baidu.com/item/%E5%8E%9F%E5%9C%B0%E7%AE%97%E6%B3%95" target="_blank"> \u539F\u5730</a></strong> \u65CB\u8F6C\u56FE\u50CF\uFF0C\u8FD9\u610F\u5473\u7740\u4F60\u9700\u8981\u76F4\u63A5\u4FEE\u6539\u8F93\u5165\u7684\u4E8C\u7EF4\u77E9\u9635\u3002<strong>\u8BF7\u4E0D\u8981 </strong>\u4F7F\u7528\u53E6\u4E00\u4E2A\u77E9\u9635\u6765\u65CB\u8F6C\u56FE\u50CF\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1\uFF1A</strong></p>
<img alt="" src="https://assets.leetcode.com/uploads/2020/08/28/mat1.jpg" style="height: 188px; width: 500px;" />
<pre>
<strong>\u8F93\u5165\uFF1A</strong>matrix = [[1,2,3],[4,5,6],[7,8,9]]
<strong>\u8F93\u51FA\uFF1A</strong>[[7,4,1],[8,5,2],[9,6,3]]
</pre>

<p><strong>\u793A\u4F8B 2\uFF1A</strong></p>
<img alt="" src="https://assets.leetcode.com/uploads/2020/08/28/mat2.jpg" style="height: 201px; width: 500px;" />
<pre>
<strong>\u8F93\u5165\uFF1A</strong>matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]
<strong>\u8F93\u51FA\uFF1A</strong>[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>n == matrix.length == matrix[i].length</code></li>
	<li><code>1 &lt;= n &lt;= 20</code></li>
	<li><code>-1000 &lt;= matrix[i][j] &lt;= 1000</code></li>
</ul>

<p>&nbsp;</p>
`,isPlus:!1},{problemsName:" 49.\u5B57\u6BCD\u5F02\u4F4D\u8BCD\u5206\u7EC4",hardRate:"MEDIUM",passRate:"67.81%",problemsUrl:"https://leetcode.cn/problems/group-anagrams/",solutionsUrl:"https://leetcode.cn/problems/group-anagrams/solution",problemsDesc:`<p>\u7ED9\u4F60\u4E00\u4E2A\u5B57\u7B26\u4E32\u6570\u7EC4\uFF0C\u8BF7\u4F60\u5C06 <strong>\u5B57\u6BCD\u5F02\u4F4D\u8BCD</strong> \u7EC4\u5408\u5728\u4E00\u8D77\u3002\u53EF\u4EE5\u6309\u4EFB\u610F\u987A\u5E8F\u8FD4\u56DE\u7ED3\u679C\u5217\u8868\u3002</p>

<p><strong>\u5B57\u6BCD\u5F02\u4F4D\u8BCD</strong> \u662F\u7531\u91CD\u65B0\u6392\u5217\u6E90\u5355\u8BCD\u7684\u6240\u6709\u5B57\u6BCD\u5F97\u5230\u7684\u4E00\u4E2A\u65B0\u5355\u8BCD\u3002</p>

<p>&nbsp;</p>

<p><strong>\u793A\u4F8B 1:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong> strs = <code>["eat", "tea", "tan", "ate", "nat", "bat"]</code>
<strong>\u8F93\u51FA: </strong>[["bat"],["nat","tan"],["ate","eat","tea"]]</pre>

<p><strong>\u793A\u4F8B 2:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong> strs = <code>[""]</code>
<strong>\u8F93\u51FA: </strong>[[""]]
</pre>

<p><strong>\u793A\u4F8B 3:</strong></p>

<pre>
<strong>\u8F93\u5165:</strong> strs = <code>["a"]</code>
<strong>\u8F93\u51FA: </strong>[["a"]]</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>1 &lt;= strs.length &lt;= 10<sup>4</sup></code></li>
	<li><code>0 &lt;= strs[i].length &lt;= 100</code></li>
	<li><code>strs[i]</code>&nbsp;\u4EC5\u5305\u542B\u5C0F\u5199\u5B57\u6BCD</li>
</ul>
`,isPlus:!1},{problemsName:" 50.Pow(x, n)",hardRate:"MEDIUM",passRate:"37.99%",problemsUrl:"https://leetcode.cn/problems/powx-n/",solutionsUrl:"https://leetcode.cn/problems/powx-n/solution",problemsDesc:`<p>\u5B9E\u73B0&nbsp;<a href="https://www.cplusplus.com/reference/valarray/pow/" target="_blank">pow(<em>x</em>, <em>n</em>)</a>&nbsp;\uFF0C\u5373\u8BA1\u7B97 <code>x</code> \u7684\u6574\u6570&nbsp;<code>n</code> \u6B21\u5E42\u51FD\u6570\uFF08\u5373\uFF0C<code>x<sup>n</sup></code><sup><span style="font-size:10.8333px"> </span></sup>\uFF09\u3002</p>

<p>&nbsp;</p>

<p><strong class="example">\u793A\u4F8B 1\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>x = 2.00000, n = 10
<strong>\u8F93\u51FA\uFF1A</strong>1024.00000
</pre>

<p><strong class="example">\u793A\u4F8B 2\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>x = 2.10000, n = 3
<strong>\u8F93\u51FA\uFF1A</strong>9.26100
</pre>

<p><strong class="example">\u793A\u4F8B 3\uFF1A</strong></p>

<pre>
<strong>\u8F93\u5165\uFF1A</strong>x = 2.00000, n = -2
<strong>\u8F93\u51FA\uFF1A</strong>0.25000
<strong>\u89E3\u91CA\uFF1A</strong>2<sup>-2</sup> = 1/2<sup>2</sup> = 1/4 = 0.25
</pre>

<p>&nbsp;</p>

<p><strong>\u63D0\u793A\uFF1A</strong></p>

<ul>
	<li><code>-100.0 &lt; x &lt; 100.0</code></li>
	<li><code>-2<sup>31</sup> &lt;= n &lt;= 2<sup>31</sup>-1</code></li>
	<li><code>n</code>&nbsp;\u662F\u4E00\u4E2A\u6574\u6570</li>
	<li>\u8981\u4E48 <code>x</code> \u4E0D\u4E3A\u96F6\uFF0C\u8981\u4E48 <code>n &gt; 0</code> \u3002</li>
	<li><code>-10<sup>4</sup> &lt;= x<sup>n</sup> &lt;= 10<sup>4</sup></code></li>
</ul>
`,isPlus:!1}];export{n as l};
