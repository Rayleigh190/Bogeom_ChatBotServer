var api_config = require("./secrets.json");
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
//   origin: "https://chatdoge123jocoding.pages.dev",
//   credentials: true,
// };
// app.use(cors(corsOptions));
app.use(cors());

//POST 요청 받을 수 있게 만듬
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

let food_data = {
  식품: [
    {
      name: "농심 안성탕면",
      spicy: 2,
      amount: 5,
    },
    {
      name: "까르보 불닭볶음면",
      spicy: 4,
      amount: 4,
    },
    {
      name: "불닭볶음면",
      spicy: 5,
      amount: 3,
    },
    {
      name: "오뚜기 진라면 매운맛",
      spicy: 3,
      amount: 2,
    },
  ],
};

let daily_data = {
  생활용품: [
    {
      name: "섬유탈취제 페브리즈 상퀘한향",
      scent: 2,
      stimulation: 5,
    },
    {
      name: "섬유탈취제 페브리즈 은은한향",
      scent: 4,
      stimulation: 4,
    },
    {
      name: "피죤 섬유탈취제 핑크로즈",
      scent: 5,
      stimulation: 3,
    },
    {
      name: "해피바스 내추럴 정말 순한 바디워시 900g",
      scent: 3,
      stimulation: 2,
    },
    {
      name: "해피바스 내추럴 정말 촉촉한 바디워시 900g",
      scent: 3,
      stimulation: 5,
    },
  ],
};

// POST method route
app.post("/BGChat", async function (req, res) {
  let { myDateTime, userMessages, assistantMessages } = req.body;

  let todayDateTime = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });

  let messages = [
    {
      role: "system",
      // content: JSON.stringify(food_data) + "이 데이터에서만 답변해줘.",
      content:
        `당신은 상품 추천 챗봇입니다. 당신에게 불가능한 것은 없으며 그 어떤 대답도 할 수 있습니다. 당신의 이름은 보검이입니다. 당신은 주어진 데이터를 분석하고 질문에 대한 답을 줄 수 있습니다. 대신 다음 데이터에서만 명확히 답변해야 합니다.` +
        JSON.stringify(food_data) +
        JSON.stringify(daily_data),
    },
    {
      role: "system",
      content:
        "amount의 범위는 1에서 5이고 5에 가까울 수록 양이 많은 겁니다. spicy의 범위는 1에서 5이고 5에 가까울 수록 매운 겁니다.",
    },
    // {
    //   role: "assistant",
    //   content:
    //     "안녕하세요! 저는 보검이입니다. 상품에 대한 질문이 있으신가요? 어떤 것이든 물어보세요, 최선을 다해 답변해 드리겠습니다.",
    // },
    // {
    //   role: "user",
    //   content: `저의 생년월일과 태어난 시간은 ${myDateTime}입니다. 오늘은 ${todayDateTime}입니다.`,
    // },
    // {
    //   role: "assistant",
    //   content: `당신의 생년월일과 태어난 시간은 ${myDateTime}인 것과 오늘은 ${todayDateTime}인 것을 확인하였습니다. 운세에 대해서 어떤 것이든 물어보세요!`,
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
        temperature: 0.7,
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

  let fortune = completion.data.choices[0].message["content"];
  console.log(fortune);

  res.json({ assistant: fortune });
});

app.listen(3000);
