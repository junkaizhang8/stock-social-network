import jwt from "jsonwebtoken";

export const createAccessToken = (username, res) => {
  const expiresIn = "15m";
  const expiresInMs = 900000;

  const token = jwt.sign({ username }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: expiresIn,
  });

  res.cookie("accessToken", token, {
    maxAge: expiresInMs,
    httpOnly: true,
  });
};

export const createRefreshToken = (username, res) => {
  const expiresIn = "30d";
  const expiresInMs = 2.592e9;

  const token = jwt.sign({ username }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: expiresIn,
  });

  res.cookie("refreshToken", token, {
    maxAge: expiresInMs,
    httpOnly: true,
  });
};

export const deleteAccessToken = (res) => {
  res.cookie("accessToken", "", {
    maxAge: 0,
    httpOnly: true,
  });
};

export const deleteRefreshToken = (res) => {
  res.cookie("refreshToken", "", {
    maxAge: 0,
    httpOnly: true,
  });
};
