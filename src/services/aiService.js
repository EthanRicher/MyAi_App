import { OPENAI_API_KEY } from "@env";
import { Doctor_To_Client } from "../prompts/Doctor_To_Client";
import { Prescription_To_Log } from "../prompts/Prescription_To_Log";

export const processWithAI = async (inputText, type = "Doctor_To_Client") => {
  let prompt = "";

  if (type === "Prescription_To_Log") {
    prompt = Prescription_To_Log(inputText);
  } else {
    prompt = Doctor_To_Client(inputText);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    return data?.choices?.[0]?.message?.content || "";
  } catch {
    return "";
  }
};