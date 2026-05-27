import { getCollection } from 'astro:content';

export async function GET() {
  const articles = await getCollection('articulos');

  const index = articles
    .filter(a => !a.data.borrador)
    .map(a => ({
      title: a.data.title,
      slug: a.slug,
      categoria: a.data.categoria,
      descripcion: a.data.descripcion,
      puntuacion: a.data.puntuacion,
      precio: a.data.precio,
      imagen: a.data.imagen,
      fecha: a.data.fecha,
    }))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
