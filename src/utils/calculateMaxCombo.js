import axios from "axios";
import dotenv from "dotenv";

import { getOsuToken } from "@/utils/getOsuToken";

dotenv.config();

const getMaxCombo = async (beatmapId) => {
  try {
    const accessToken = await getOsuToken();
    const response = await axios.get(
      `https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (response.data && response.data.max_combo) {
      const maxCombo = response.data.max_combo;
      //console.log(`地圖ID: ${beatmapId} 的最大 Combo 數是: ${maxCombo}`);
      return maxCombo;
    } else {
      throw new Error("未能獲取地圖數據或最大 Combo 數");
    }
  } catch (error) {
    console.error("獲取最大 Combo 數時出錯: ", error.message);
    throw error;
  }
};

export { getMaxCombo };
