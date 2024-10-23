import * as rosu from "rosu-pp-js";
import * as fs from "fs";
import axios from "axios";
import path from "path";

const getPP = async (
  beatmapId,
  mods,
  accuracy,
  combo,
  misses,
  score,
  count300,
  count100,
  count50
) => {
  try {
    const cacheDir = path.join(__dirname, "../../src/cache");
    const cachePath = path.join(cacheDir, `${beatmapId}.osu`);

    // 檢查並創建緩存目錄（如有必要）
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // 檢查地圖是否已在緩存中
    if (!fs.existsSync(cachePath)) {
      // 獲取地圖數據並寫入緩存
      const beatmapResponse = await axios.get(
        `https://osu.ppy.sh/osu/${beatmapId}`
      );
      const beatmapData = beatmapResponse.data;
      fs.writeFileSync(cachePath, beatmapData);
    }

    const bytes = fs.readFileSync(cachePath);

    // 解析地圖zxz
    // 初始化 Performance 計算
    const calc = new rosu.Performance({
      mode: rosu.GameMode.osu,
      mods: mods.join(""), // mods 應該是字符串，如 'HDDT'
      misses: misses,
      score: score,
      accuracy: parseFloat(accuracy), // 準確率應為數字
      combo: combo, // 包括連擊數
      count300: count300, // 300數量
      count100: count100, // 100數量
      count50: count50, // 50數量
      hitresultPriority: rosu.HitResultPriority.WorstCase,
    });

    // 計算 Performance Points (PP)
    const result = calc.calculate(map);
    map.free(); // 釋放地圖以避免內存泄漏

    return result.pp.toFixed(2);
  } catch (error) {
    console.error("計算PP時出錯: ", error);
    return `0.00`; // 返回0表示計算出錯
  }
};

export { getPP };
