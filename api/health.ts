type VercelRequest = {
  method?: string;
};

type VercelResponse = {
  json: (body: unknown) => void;
};

export default function handler(_request: VercelRequest, response: VercelResponse) {
  response.json({
    ok: true,
    screenshotExtraction: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}
