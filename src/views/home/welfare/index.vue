<template>
  <div class="">
    <el-row>
      <el-col
        :span="24"
        :md="24"
        :lg="24"
        v-for="(item, sonIndex) in welfareData"
        :key="sonIndex"
      >
        <!-- <div class="welfare-title" v-if="sonIndex == 0">7号</div> -->
        <el-card shadow="hover" class="welfare-card">
          <div class="welfare-date">
            <div class="day-week-welfare">
              <div class="welfare-week">{{ handleWeek(item) }}</div>
              <div class="welfare-day">{{ handleDay(item) }}</div>
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
                <el-icon><Timer /></el-icon>
              </div>
              <div>{{ handleHour(item) }}</div>
            </div>
            <div>
              <a
                class="welfare-link-title"
                :href="item.link"
                @click.prevent="gotoWelfareWebsite(item)"
              >
                {{ item.title }}
              </a>
              <div class="welfare-div-link">
                <img
                  :src="item.img_src ? item.img_src : logoUrl"
                  alt="作者"
                  class="welfare-img-link"
                />
              </div>
            </div>
          </div>
          <div class="welfare-div-website">
            <img
              :src="handleWebsiteImg(item) ? handleWebsiteImg(item) : logoUrl"
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
import { gotoOutPage } from "../../../utils/utils";
import welfareSource from "../../../public/data/welfare.json";
import logoImageUrl from "../../../public/img/logo.jpg";
export default {
  setup() {
    const logoUrl = ref(logoImageUrl);
    let welfareData = ref(welfareSource);
    const handleWeek = (item: any) => {
      const date = new Date(item.timestamp);
      const dayOfWeek = date.getDay();
      const weekdays = [
        "星期日",
        "星期一",
        "星期二",
        "星期三",
        "星期四",
        "星期五",
        "星期六",
      ];
      const dayName = weekdays[dayOfWeek];
      return dayName;
    };
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
    const gotoWelfareWebsite = (item: any) => {
      console.log(item);
      if (item.link) {
        gotoOutPage(item.link);
      }
    };
    const handleWebsiteName = (item: any) => {
      // 根据 item 的属性动态计算图片的 src 值
      let websiteName = "";
      switch (String(item.website)) {
        case "hxm5":
          websiteName = "线报引擎";
          break;
        case "mutouxb":
          websiteName = "86收线报网";
          break;
        default:
          websiteName = "羊毛";
      }
      return websiteName;
    };
    const handleWebsiteImg = (item: any) => {
      // 根据 item 的属性动态计算图片的 src 值
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
        default:
          websiteImg = "羊毛";
      }
      return websiteImg;
    };
    return {
      logoUrl,
      welfareData,
      handleWeek,
      handleDay,
      handleHour,
      gotoWelfareWebsite,
      handleWebsiteName,
      handleWebsiteImg,
    };
  },
  methods: {},
};
</script>
<style scoped>
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
  max-width: 700px;
}
.day-week-welfare {
  margin: 0px 20px;
}
.welfare-day {
  color: #737373;
  font-weight: 600;
  font-size: 46px;
}
.welfare-week {
  color: #797979;
  font-weight: 600;
  font-size: 16px;
  margin-left: 5px;
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
.el-card.is-hover-shadow:focus,
.el-card.is-hover-shadow:hover {
  background: linear-gradient(45deg, #f1f1f1, #f1f1f1 50%, #e8e8e8 50%, #e8e8e8),
    linear-gradient(45deg, #d9d9d9, #d9d9d9 50%, #ffffff 50%, #ffffff),
    linear-gradient(45deg, #cccccc, #cccccc 50%, #f1f1f1 50%, #f1f1f1);
  background-size: 100% 100px;
  background-repeat: repeat-y;
}
</style>