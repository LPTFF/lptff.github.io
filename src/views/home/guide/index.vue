<template>
  <div class="">
    <el-row>
      <el-col
        :span="24"
        :md="24"
        :lg="24"
        v-for="(item, sonIndex) in newsGuide"
        :key="sonIndex"
      >
        <el-card shadow="hover" class="welfare-card">
          <div class="welfare-date">
            <div class="day-week-welfare">
              <div
                class="welfare-month"
                :style="`color:${handleYearColor(item)}`"
              >
                <div class="welfare-icon-hour">
                  <el-icon :size="15"><Calendar /></el-icon>
                </div>
                {{ handleMonth(item) }}
              </div>
              <div
                class="welfare-day"
                :style="`color:${handleYearColor(item)}`"
              >
                {{ handleDay(item) }}
              </div>
            </div>
            <div>
              <el-divider
                direction="vertical"
                color="#cccccc"
                class="el-welfare-divider"
              />
            </div>
            <div class="welfare-hour">
              <div class="welfare-icon-hour">
                <el-icon :size="16"><Timer /></el-icon>
              </div>
              <div>{{ handleHour(item) }}</div>
            </div>
            <div>
              <a
                class="welfare-link-title"
                :href="handleLinkUrl(item)"
                @click.prevent="gotoWelfareWebsite(item)"
              >
                {{ item.title }}
              </a>
              <div class="welfare-div-link">
                <img
                  :src="handleAuthorImg(item)"
                  alt="作者"
                  class="welfare-img-link"
                  @error="handleImageError"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
          <div class="welfare-div-website">
            <img
              :src="handleWebsiteImg(item)"
              alt="网站"
              class="welfare-img-link"
            />
            <div class="welfare-name-link">
              {{ handleWebsiteName(item) }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
  
  <script lang="ts">
import { ref } from "vue";
import { gotoOutPage, isPC } from "../../../utils/utils";
import welfareSource from "../../../public/data/welfare.json";
import infzmNews from "../../../public/data/infzm.json";
import juejinNews from "../../../public/data/juejin.json";
import v2exNews from "../../../public/data/v2ex.json";
import logoImageUrl from "../../../public/img/logo.jpg";
export default {
  setup() {
    const logoUrl = ref(logoImageUrl);
    let welfareData = ref(welfareSource);
    let infzmList = ref(infzmNews);
    let juejinList = ref(juejinNews);
    let v2exList = ref(v2exNews);
    let newsGuide: any[] = [];
    newsGuide = [
      ...infzmList.value,
      ...juejinList.value,
      ...v2exList.value,
      ...welfareData.value,
    ];
    newsGuide.sort((a, b) => b.timestamp - a.timestamp); //按时间最新的靠前排序
    const handleDay = (item: any) => {
      const date = new Date(item.timestamp);
      const day = date.getDate();
      const formattedDay = day < 10 ? "0" + day : day.toString();
      return formattedDay;
    };
    const handleHour = (item: any) => {
      const date = new Date(item.timestamp);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const formattedHours = hours < 10 ? "0" + hours : hours.toString();
      const formattedMinutes =
        minutes < 10 ? "0" + minutes : minutes.toString();
      const timeString = `${formattedHours}:${formattedMinutes}`;
      return timeString;
    };
    const handleAuthorImg = (item: any) => {
      let websiteLogo = "";
      switch (String(item.website)) {
        case "juejin":
        case "infzm":
        case "v2ex":
          websiteLogo = item.image ? item.image : logoUrl.value;
          break;
        case "hxm5":
        case "mutouxb":
          websiteLogo = item.img_src ? item.img_src : logoUrl.value;
          break;
        default:
          websiteLogo = logoUrl.value;
      }
      return websiteLogo;
    };
    const handleLinkUrl = (item: any) => {
      let websiteUrl = "";
      let data = isPC();
      switch (String(item.website)) {
        case "infzm":
          websiteUrl = data
            ? `https://www.infzm.com/contents/${item.url}`
            : `https://www.infzm.com/wap/#/content/${item.url}?source=133&source_1=1`;
          break;
        case "juejin":
        case "v2ex":
          websiteUrl = item.url;
          break;
        case "hxm5":
        case "mutouxb":
          websiteUrl = item.link;
          break;
      }
      return websiteUrl;
    };
    const gotoWelfareWebsite = (item: any) => {
      let websiteUrl = handleLinkUrl(item);
      console.log(websiteUrl);
      if (websiteUrl) {
        gotoOutPage(websiteUrl);
      }
    };
    const handleWebsiteName = (item: any) => {
      let websiteName = "";
      switch (String(item.website)) {
        case "hxm5":
          websiteName = "线报引擎";
          break;
        case "mutouxb":
          websiteName = "86收线报网";
          break;
        case "juejin":
          websiteName = "掘金";
          break;
        case "infzm":
          websiteName = "南方周末";
          break;
        case "v2ex":
          websiteName = "V2EX";
          break;
        default:
          websiteName = "随风而逝";
      }
      return websiteName;
    };
    const handleWebsiteImg = (item: any) => {
      let websiteImg = "";
      switch (String(item.website)) {
        case "hxm5":
          websiteImg =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACa0lEQVR4AXWTQ7gcQRSFe3qYL6vYts1NbJvreJVd1N2xbds2NrFt25mZdr/u4cmtZy7Kdf+LOsVB5IonBW4/BE6jhqTIISG6cjbBjaTgAuiM3Um7SzZky9FkLzvI3tjlxAwP4oKPRjcBeJAT5L7HbFkECvMaE3kYswrBXFob1u7eME6Nh3VpKlJOToC+rTuMeSUJxhPMlR0QZgAkqBnrG8H6eA6O/Rvmj3vQX+yDem89jEc74QQfwAw9RnDvaERFX3YAMgH22voInp+GuB1CcGVbRGd44UhexEUv5LkVoF6bj4j5BeqS2tnTSAOkpeCGPr8Kkk4I6v6BZOhBjLxFRD9iVIfQkqoU3V+YW7vkBaRFwUObXz0NsKcfGXpSoVHJg/C8qpTKbkSCT8hJuYIALhgrGhMgDGVVKziCH8qcYpD3DEPKjxtw/t1FeG17KqQ3f0CMANrOPkjo3/Fz72Aor4/DCb2H4yhQrq6EOq8SHErJkQIFRCBQDc5PhvP9JuR1LSBfmQ/jxkbEzR8wnhyEurguAfwFA+JUKOPBeqS8OMOeKlU8UcEDeUMX2D/vwpZfQ987HLZYmM68iNFZUnRlAZiR9eIYtOfHEJvJp0FFglAh5QXVYT3aTumoMB9toBepRXAvKzwBhIwaeGA9Xgfn9xNESZEZko6TpzhBbKkw9GOTEFW/UW1eIbx/OKKkEwbQUr1JPOSl1SDv6MYM8uiepE568ENeUhfa6bFM3pS2R+OSaZ+J5cw+DnkMsNxyA+icQ4QJi6lT8FFqPDmiz0QqLAqCkJy1mOQCrVnLA2ARMkiCwSROo/z3UopF/wMtJbFAANdXrAAAAABJRU5ErkJggg==";
          break;
        case "mutouxb":
          websiteImg =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAALVBMVEVHcEz/UwD/VAD/VAD/UwD+UwD/UwD/UwD/UwD+UwD+UwD+UwD9UgD+UwD/VAAEMvkGAAAADnRSTlMAQOHzw5TW6zEhfFoQp2Bl2BQAAADGSURBVDiNzZPZDsQgCEVRXOpS//9zp1ZR0DbzNMnch8bIYSsIwHWYqhNepUqV/iPg+AKE4sIKHAzI/jqqcfkm28l3XSHMNyAWbJqhPJIMLzEM4KHBKjcA3PqrSiyzewJEN2a3n7L6LQZL4O5YLgt75s4N9mrvIN5fDdhIO+3tbyYaFuXTFOTsDmPcVnZjKeDcB81mAXEknEBgQPOPIABaE6T8CRagn1WrX/fhiJ1UeNcYeb9yqzOW6hj9nP7yLnJaB/KTp/cBnJYXiHf+EHYAAAAASUVORK5CYII=";
          break;
        case "juejin":
          websiteImg =
            "https://lf3-cdn-tos.bytescm.com/obj/static/xitu_juejin_web/6c61ae65d1c41ae8221a670fa32d05aa.svg";
          break;
        case "infzm":
          websiteImg =
            "http://www.infzm.com/web/images/infzm-meta-icon.png?f25705e975f00770a3e8a74f1a08a170";
          break;
        case "v2ex":
          websiteImg =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADg0lEQVR4AWKAgf///7NeuXJl47Fjx77t2bPn37Zt2/5t2bIF0HsZtcIWRmF4fgoREodSiogIIEq59lP8D3fuKeeOcTfDDSFNSSKKCwAAA77Tc/HsOs03xpGOenrX7LW+9a6997d3dvgJ6EVPeuOBV2LM3/b29q/l5eU8xf+DpaWlPJ7JmXOARDqdDkdHR+Hx8TG8v7+Hj48PAY+hxuqnvL290ZPeeCRD4J3ikmh+e3v7ZcNIXj6tx8Mh8E5xX/hxeHhIAdOG19dXMEaN1Sil6onxwAtPvFNsDn48PDwkxS8vL2CMRjEXr4/n8cALT7xT7naTFkM+n1eN1W/BWj18OlIEQAI0g+fnZ9VY/Tb66Jsy8ApoABMTE6G8vDxAWVmZapwo1NTUhKmpKdbHBjb2NscHgKenp4TKyspQUVEBxOqnTE9Puz6GeyI+AAmKeGahqqoqVFdXRyGnisdmZ2ftoxrjEb8CJIAd6oLa2tpvUV9fH+bn5+lhP9GncADvEwuERnV1dWCMRjFnfVNTU8hms/YSn4biA9zf3yc0NjYmNDQ0qMZqFHKtra1hdXWVXoJHfAB3KUV3d3dgcUkODg7C0NAQZ11AV1dXyOVy9i06AObAu9oBSr4HjNH9/f3Q29sbmpubC2C4q6sretsrPgC7lKKbmxswRo2jeYblKgwODoaWlpYCRkZGSg6AOdDwn9nZ2QljY2Ohra0tob29HeXsw9bWFnXh+vpan+IDUCQdHR2hs7MTjNEv09/fHzY3N7n/9iw9AJfK4u7ubjYRGKPGapS+vr6wsrLCo0dP8cVUOAAH4fLyMqGnp+fLsAFVzjyTyWhuP9AnPgALKLq4uAhAo4GBATBGjaN5WFhYoBc97GfM8fgAJFwkbKDh4WEwRqOYm5ubKzgROT8/16f4ABTJ5ORk4BGC0dFR1ThRGB8fDzMzM2w4zaIUHYCFJM7OzgqKv4rm9LCPamydvsm/ZLxMSJyenorHxMXFzDVxfRTqeCck/5ItLi4yQGByDGlycnICLFCN1Sil6umNB1544p3KZrOP/Njb2wskmY6zYMHx8bFqrEbzEqunp69tvPDEO7WxscGHCY8Oxb73o7BY/Q6sxQMvPNfX13+n+DzKZDJ5h9jd3XVaFvwIvFXpSW/N8Uw+UnO53C+H+B/ghWfKPz9SuSTcl3Q6/eOf52w4eq+trf31ef4H8lDJyDc4UgoAAAAASUVORK5CYII=";
          break;
        default:
          websiteImg = "羊毛";
      }
      return websiteImg;
    };
    const handleMonth = (item: any) => {
      const date = new Date(item.timestamp);
      const month = date.getMonth() + 1;
      return month + "月";
    };
    const handleImageError = (event: any) => {
      event.target.src = logoUrl.value;
    };
    const handleYearColor = (item: any) => {
      const date = new Date(item.timestamp);
      // 获取对应的年份
      const year = date.getFullYear();
      // 获取当前系统时间的年份
      const currentYear = new Date().getFullYear();
      return year < currentYear ? `#e96a43` : "";
    };
    return {
      logoUrl,
      welfareData,
      handleDay,
      handleHour,
      gotoWelfareWebsite,
      handleWebsiteName,
      handleWebsiteImg,
      newsGuide,
      handleAuthorImg,
      handleLinkUrl,
      handleMonth,
      handleYearColor,
      handleImageError,
    };
  },
  methods: {},
};
</script>
  <style scoped>
.welfare-month {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #797979;
  font-weight: 600;
  font-size: 16px;
}
.welfare-div-website {
  display: flex;
  margin: auto 0;
}
.welfare-name-link {
  margin-top: 4px;
  color: #797979;
  font-weight: 600;
  font-size: 14px;
}
.welfare-img-link {
  height: 30px;
  width: 30px;
  border-bottom-left-radius: 50%;
  border-bottom-right-radius: 50%;
  border-top-left-radius: 50%;
  border-top-right-radius: 50%;
  margin-right: 10px;
}
.welfare-link-title {
  display: block;
  color: #797979;
  height: 50px;
  font-size: 18px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap; /* 防止内容换行 */
  overflow: hidden; /* 隐藏超出容器宽度的内容 */
  text-overflow: ellipsis; /* 使用省略号表示被截断的文本 */
  max-width: 600px;
}
.day-week-welfare {
  margin: 0px 20px;
}
.welfare-day {
  color: #737373;
  font-weight: 600;
  font-size: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.welfare-week {
  color: #797979;
  font-weight: 600;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.welfare-icon-hour {
  margin-right: 8px;
  margin-top: 2px;
}
.welfare-hour {
  margin: 0px 40px 0px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #797979;
  font-weight: 600;
  font-size: 14px;
}
.welfare-div-link {
  display: flex;
  /* margin-top: 27px; */
}
.el-welfare-divider {
  height: 100%;
}
.welfare-date {
  margin-right: 20px;
  display: flex;
}
.welfare-title {
  height: 30px;
  width: 55px;
  margin-bottom: 10px;
  color: #5b5d5c;
  font-weight: 600;
  font-size: 21px;
}
.welfare-card {
  margin: 0px 0px 10px 0px;
}
:deep(.el-card__body) {
  justify-content: space-between;
  display: flex;
}
</style>