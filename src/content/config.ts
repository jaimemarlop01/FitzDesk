import { defineCollection, z } from 'astro:content';

const articulosCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    categoria: z.string(),
    fecha: z.string(),
    descripcion: z.string(),
    imagen: z.string(),
    puntuacion: z.number().optional(),
    precio: z.string(),
    enlace_afiliado: z.string(),
    tiempo_lectura: z.string().optional(),
    fitzQuote: z.string().optional(),
    especificaciones: z.record(z.string()).optional(),
    borrador: z.boolean().optional(),
  }),
});

export const collections = {
  articulos: articulosCollection,
};
