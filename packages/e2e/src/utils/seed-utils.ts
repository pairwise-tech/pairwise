import axios from "axios";
import { createAuthenticatedUser, HOST } from "./e2e-utils";

const postFeedback = async (token: string) => {
  const body = {
    feedback: "hi",
    type: "TOO_HARD",
    challengeId: "0fCd6MkU",
  };
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  await axios.post(`${HOST}/feedback`, body, { headers });
};

const main = async () => {
  const result = await createAuthenticatedUser("github");
  const { accessToken } = result;

  await postFeedback(accessToken);
  await postFeedback(accessToken);
  await postFeedback(accessToken);
  await postFeedback(accessToken);
  await postFeedback(accessToken);
};

main();
