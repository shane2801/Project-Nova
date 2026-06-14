export async function GET() {
  const res = await fetch("http://localhost:3000/api/stations");
  const data = await res.json();
  return Response.json(data);
}