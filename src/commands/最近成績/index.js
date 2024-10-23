import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import axios from "axios";
import dotenv from "dotenv";
import { getOsuToken } from "@/utils/getOsuToken";
import { getMaxCombo } from "@/utils/calculateMaxCombo";
import { getPP } from "@/utils/calculatePP";

dotenv.config();

export const command = new SlashCommandBuilder()
  .setName("最近成績")
  .setDescription("查詢最近的所有成績")
  .addStringOption((option) =>
    option.setName("用戶名").setDescription("要查詢的用戶名").setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("模式")
      .setDescription("選擇遊戲模式（可選）")
      .setRequired(false)
      .addChoices(
        { name: "osu!", value: "osu" },
        { name: "osu!taiko", value: "taiko" },
        { name: "osu!catch", value: "fruits" },
        { name: "osu!mania", value: "mania" }
      )
  );

export const action = async (interaction) => {
  await interaction.deferReply(); // 立即延遲回應
  const username = interaction.options.getString("用戶名");
  const mode = interaction.options.getString("模式");
  try {
    const accessToken = await getOsuToken();
    console.log(`查詢用戶名: ${username}`);
    const userResponse = await axios.get(
      `https://osu.ppy.sh/api/v2/users/${username}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userId = userResponse.data.id;
    console.log(`User ID: ${userId}`);
    const response = await axios.get(
      `https://osu.ppy.sh/api/v2/users/${userId}/scores/recent`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          include_fails: 1,
          mode: mode,
          limit: 1,
        },
      }
    );

    const recentScore = response.data[0];
    if (recentScore) {
      const MaxCombo = await getMaxCombo(recentScore.beatmap.id);
      const accuracy = (recentScore.accuracy * 100).toFixed(2);
      const count300 = recentScore.statistics.count_300;
      const count100 = recentScore.statistics.count_100;
      const count50 = recentScore.statistics.count_50;
      const misses = recentScore.statistics.count_miss;
      const score = recentScore.score;

      // 計算 FC SS 情況下的 PP
      const pp_SS_FC = await getPP(
        recentScore.beatmap.id,
        recentScore.mods,
        100,
        MaxCombo,
        0,
        score,
        count300,
        count100,
        count50
      );

      // 計算 非FC 情況下的 PP
      const ppNoFC =
        recentScore.pp == null
          ? await getPP(
              recentScore.beatmap.id,
              recentScore.mods,
              accuracy,
              recentScore.max_combo,
              misses,
              score,
              count300,
              count100,
              count50
            )
          : recentScore.pp.toFixed(2);

      //console.log(recentScore);
      const exampleEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setAuthor({
          name: `${username}: ${userResponse.data.statistics.pp}pp (#${userResponse.data.statistics.global_rank} ${userResponse.data.country.code}#${userResponse.data.statistics.country_rank})`,
          iconURL: `https://flagcdn.com/256x192/${userResponse.data.country.code.toLowerCase()}.png`,
        })
        .setTitle(
          `${recentScore.beatmapset.title} [${recentScore.beatmap.version}] [${recentScore.beatmap.difficulty_rating}★]`
        )
        .setURL(recentScore.beatmap.url)
        .setImage(`${recentScore.beatmapset.covers.cover}`)
        .addFields(
          { name: "獲得的PP", value: `${ppNoFC}/${pp_SS_FC}pp`, inline: true },
          {
            name: "地圖評分",
            value: `評分: ${recentScore.rank}, 總分: ${recentScore.score}`,
            inline: true,
          },
          { name: "準確率", value: `${accuracy}%`, inline: true },
          {
            name: "所使用的Mods",
            value: `${
              recentScore.mods.length ? recentScore.mods.join(", ") : "NM"
            }`,
            inline: true,
          },
          {
            name: "總連擊數",
            value: `x${recentScore.max_combo}/${MaxCombo}`,
            inline: true,
          },
          {
            name: "統計數據",
            value: `[${recentScore.statistics.count_300}/${recentScore.statistics.count_100}/${recentScore.statistics.count_50}/${recentScore.statistics.count_miss}]`,
            inline: true,
          }
        )
        .setFooter({
          text: `osu! Mode - ${recentScore.mode}  [ Bot Made By small R ]`,
          iconURL:
            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Osu%21_Logo_2016.svg/2048px-Osu%21_Logo_2016.svg.png",
        });

      await interaction.editReply({ embeds: [exampleEmbed] }); // 編輯回應
    } else {
      await interaction.editReply("未找到最近成績。"); // 編輯回應
    }
    console.log("Successfully replied to interaction");
  } catch (error) {
    if (error.response) {
      console.error("查詢成績時出錯: ", error.response.data);
    } else {
      console.error("查詢成績時出錯: ", error.message);
    }
    await interaction.editReply("查詢成績時出錯，請稍後再試。"); // 編輯回應
  }
};
