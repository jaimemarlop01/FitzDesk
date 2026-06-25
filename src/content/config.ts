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
    imagen_thumb: z.string().optional(),
    presupuesto: z.string().optional(),
    enlace_a: z.string().optional(),
    enlace_b: z.string().optional(),
    enlaces: z.array(z.string()).optional(),
    keyword_principal: z.string().optional(),
    keywords_secundarias: z.array(z.string()).optional(),
    fecha_actualizacion: z.string().optional(),
    actualizado: z.boolean().optional(),
    criterios: z.record(z.number()).optional(),
    precio_oferta: z.string().optional(),
    precio_normal: z.string().optional(),
    descuento: z.string().optional(),
    oferta_activa: z.boolean().optional(),
    analisis_relacionado: z.string().optional(),
  }),
});

export const collections = {
  articulos: articulosCollection,
};
