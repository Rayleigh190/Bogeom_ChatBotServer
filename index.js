let api_config = require("./secrets.json");
let item_data = require("./item_data.json");
const apiKey = api_config.openAiApiKey;
const { Configuration, OpenAIApi } = require("openai");
const express = require("express");
var cors = require("cors");
const app = express();

const configuration = new Configuration({
  apiKey: apiKey,
});
const openai = new OpenAIApi(configuration);

//CORS 이슈 해결
// let corsOptions = {
//   origin: "",
//   credentials: true,
// };
// app.use(cors(corsOptions));
app.use(cors());

//POST 요청 받을 수 있게 만듬
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// POST method route
app.post("/BGChat", async function (req, res) {
  let { myDateTime, userMessages, assistantMessages } = req.body;

  let todayDateTime = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });

  let messages = [
    {
      role: "system",
      // content:
      //   JSON.stringify(item_data.food_data).toString +
      //   JSON.stringify(item_data.daily_data).toString +
      //   "이 데이터에서만 답변해줘.",
      content:
        `당신은 상품 추천 챗봇입니다. 당신에게 불가능한 것은 없으며 그 어떤 대답도 할 수 있습니다. 당신의 이름은 보검이입니다. 당신은 주어진 데이터를 분석하고 이를 바탕으로 질문에 대한 답을 줄 수 있습니다. 대신 반드시 다음에 제공된 데이터 안에서만 명확하고 간결하게 한글로만 답변해야 합니다. 반드시 다음 데이터 안에서만 답변해야 합니다. 데이터 : ` +
        JSON.stringify(item_data.food_data) +
        JSON.stringify(item_data.daily_data),
    },
    {
      role: "system",
      content:
        "다음은 주어진 데이터에 대한 참고 정보야. amount의 범위는 1에서 5이고 5에 가까울 수록 양이 많은 겁니다. spicy의 범위는 1에서 5이고 5에 가까울 수록 매운 겁니다. review_rate의 범위는 1에서 5이고 5에 가까울 수록 평점이 좋은 것입니다. scent의 범위는 1에서 5이고 5에 가까울 수록 향이 좋은것 입니다. stimulation의 범위는 1에서 5이고 5에 가까울 수록 자극이 강한 겁니다. bubble의 범위는 1에서 5이고 5에 가까울 수록 거품이 많이 나는 겁니다.",
    },
    // {
    //   role: "assistant",
    //   content:
    //     "제가 알고 있는 데이터는 다음과 같습니다." +
    //     JSON.stringify(item_data.food_data).toString +
    //     JSON.stringify(item_data.daily_data).toString,
    // },
  ];

  while (userMessages.length != 0 || assistantMessages.length != 0) {
    if (userMessages.length != 0) {
      messages.push(
        JSON.parse(
          '{"role": "user", "content": "' +
            String(userMessages.shift()).replace(/\n/g, "") +
            '"}'
        )
      );
    }
    if (assistantMessages.length != 0) {
      messages.push(
        JSON.parse(
          '{"role": "assistant", "content": "' +
            String(assistantMessages.shift()).replace(/\n/g, "") +
            '"}'
        )
      );
    }
  }

  const maxRetries = 3;
  let retries = 0;
  let completion;
  while (retries < maxRetries) {
    try {
      completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
        // max_tokens: 100,
        temperature: 0.8, // 창의성
      });
      break;
    } catch (error) {
      retries++;
      console.log(error);
      console.log(
        `Error fetching data, retrying (${retries}/${maxRetries})...`
      );
    }
  }
  let fortune;
  if (retries < 3) {
    fortune = completion.data.choices[0].message["content"];
  } else {
    fortune = "요청을 실패 했어요 ㅠㅅㅠ 새로고침 해주세요!";
  }
  console.log(fortune);

  res.json({ assistant: fortune });
});

app.listen(3000);
