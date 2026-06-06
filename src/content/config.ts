import { defineCollection, z } from 'astro:content';

const articulosCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    categoria: z.string(),
    fecha: z.string(),
    descripcion: z.string(),
    imagen: z.string(),
    tipo: z.string().optional(),
    puntuacion: z.number().optional(),
    precio: z.string().optional(),
    enlace_afiliado: z.string().optional(),
    tiempo_lectura: z.string().optional(),
    fitzQuote: z.string().optional(),
    especificaciones: z.record(z.string()).optional(),
    borrador: z.boolean().optional(),
  }),
});

export const collections = {
  articulos: articulosCollection,
};
