import { NextRequest, NextResponse } from "next/server";

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

const headers = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

export async function GET() {
  const res = await fetch(
    `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ page_size: 100 }),
    },
  );
  const data = await res.json();
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { pageId, status } = await req.json();
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      properties: {
        Status: { status: { name: status } },
      },
    }),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
