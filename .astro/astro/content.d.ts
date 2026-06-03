declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
			components: import('astro').MDXInstance<{}>['components'];
		}>;
	}
}

declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"articulos": {
"asus-vivobook-15-oled-analisis.md": {
	id: "asus-vivobook-15-oled-analisis.md";
  slug: "asus-vivobook-15-oled-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"benq-gw2780-analisis.md": {
	id: "benq-gw2780-analisis.md";
  slug: "benq-gw2780-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-adata-lleva-a-computex-b2026b-el-urban-tapsafe-un-ssd-externo-que-se-desbloquea-.md": {
	id: "borrador-adata-lleva-a-computex-b2026b-el-urban-tapsafe-un-ssd-externo-que-se-desbloquea-.md";
  slug: "borrador-adata-lleva-a-computex-b2026b-el-urban-tapsafe-un-ssd-externo-que-se-desbloquea-";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-asus-rog-strix-scar-18-una-bestia-capaz-de-todo---muycomputer.md": {
	id: "borrador-asus-rog-strix-scar-18-una-bestia-capaz-de-todo---muycomputer.md";
  slug: "borrador-asus-rog-strix-scar-18-una-bestia-capaz-de-todo---muycomputer";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-computex-b2026b-antec-presenta-novedades-en-refrigeracion-minipcs-torres-y-perif.md": {
	id: "borrador-computex-b2026b-antec-presenta-novedades-en-refrigeracion-minipcs-torres-y-perif.md";
  slug: "borrador-computex-b2026b-antec-presenta-novedades-en-refrigeracion-minipcs-torres-y-perif";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-corsair-anade-una-pantalla-ips-de-5-a-la-icue-link-titan-ii-ultra-360-lx-lcd.md": {
	id: "borrador-corsair-anade-una-pantalla-ips-de-5-a-la-icue-link-titan-ii-ultra-360-lx-lcd.md";
  slug: "borrador-corsair-anade-una-pantalla-ips-de-5-a-la-icue-link-titan-ii-ultra-360-lx-lcd";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-corsair-presenta-en-computex-b2026b-el-teclado-clipper-pro-mini-60-el-raton---ge.md": {
	id: "borrador-corsair-presenta-en-computex-b2026b-el-teclado-clipper-pro-mini-60-el-raton---ge.md";
  slug: "borrador-corsair-presenta-en-computex-b2026b-el-teclado-clipper-pro-mini-60-el-raton---ge";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-corsair-renueva-su-catalogo-de-perifericos-en-computex-b2026b-con-bnuevos-teclad.md": {
	id: "borrador-corsair-renueva-su-catalogo-de-perifericos-en-computex-b2026b-con-bnuevos-teclad.md";
  slug: "borrador-corsair-renueva-su-catalogo-de-perifericos-en-computex-b2026b-con-bnuevos-teclad";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-despliegue-de-portatiles-y-prototipos-con-nvidia-rtx-spark-asi-son-todos-los-mod.md": {
	id: "borrador-despliegue-de-portatiles-y-prototipos-con-nvidia-rtx-spark-asi-son-todos-los-mod.md";
  slug: "borrador-despliegue-de-portatiles-y-prototipos-con-nvidia-rtx-spark-asi-son-todos-los-mod";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-equipos-para-jugar-para-nomadas-digitales-o-para-las-tareas-mas-exigentes-cinco-.md": {
	id: "borrador-equipos-para-jugar-para-nomadas-digitales-o-para-las-tareas-mas-exigentes-cinco-.md";
  slug: "borrador-equipos-para-jugar-para-nomadas-digitales-o-para-las-tareas-mas-exigentes-cinco-";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-lg-display-muestra-el-futuro-de-los-monitores-oled-gaming-con-2000-nits-5k-27-22.md": {
	id: "borrador-lg-display-muestra-el-futuro-de-los-monitores-oled-gaming-con-2000-nits-5k-27-22.md";
  slug: "borrador-lg-display-muestra-el-futuro-de-los-monitores-oled-gaming-con-2000-nits-5k-27-22";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-xbox-ally-x20-la-primera-consola-de-la-xbox-de-asha-sharma-es-una-portatil.md": {
	id: "borrador-xbox-ally-x20-la-primera-consola-de-la-xbox-de-asha-sharma-es-una-portatil.md";
  slug: "borrador-xbox-ally-x20-la-primera-consola-de-la-xbox-de-asha-sharma-es-una-portatil";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"dell-s2722qc-analisis.md": {
	id: "dell-s2722qc-analisis.md";
  slug: "dell-s2722qc-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"keychron-k2-v2.md": {
	id: "keychron-k2-v2.md";
  slug: "keychron-k2-v2";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"keychron-k8-pro-analisis.md": {
	id: "keychron-k8-pro-analisis.md";
  slug: "keychron-k8-pro-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"keychron-v1-analisis.md": {
	id: "keychron-v1-analisis.md";
  slug: "keychron-v1-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"lenovo-thinkpad-e14-gen6-analisis.md": {
	id: "lenovo-thinkpad-e14-gen6-analisis.md";
  slug: "lenovo-thinkpad-e14-gen6-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"lg-27un880.md": {
	id: "lg-27un880.md";
  slug: "lg-27un880";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"lg-27up850n-analisis.md": {
	id: "lg-27up850n-analisis.md";
  slug: "lg-27up850n-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"lg-gram-14-2025-analisis.md": {
	id: "lg-gram-14-2025-analisis.md";
  slug: "lg-gram-14-2025-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"logitech-lift-vertical-analisis.md": {
	id: "logitech-lift-vertical-analisis.md";
  slug: "logitech-lift-vertical-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"logitech-mx-anywhere-3s-analisis.md": {
	id: "logitech-mx-anywhere-3s-analisis.md";
  slug: "logitech-mx-anywhere-3s-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"logitech-mx-keys-s-analisis.md": {
	id: "logitech-mx-keys-s-analisis.md";
  slug: "logitech-mx-keys-s-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"logitech-mx-master-3s-analisis.md": {
	id: "logitech-mx-master-3s-analisis.md";
  slug: "logitech-mx-master-3s-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"mejor-setup-teletrabajo-500-euros-2026.md": {
	id: "mejor-setup-teletrabajo-500-euros-2026.md";
  slug: "mejor-setup-teletrabajo-500-euros-2026";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"raton-ergonomico-vs-estandar-teletrabajo.md": {
	id: "raton-ergonomico-vs-estandar-teletrabajo.md";
  slug: "raton-ergonomico-vs-estandar-teletrabajo";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"setup-teletrabajo-profesional-2026.md": {
	id: "setup-teletrabajo-profesional-2026.md";
  slug: "setup-teletrabajo-profesional-2026";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("./../../src/content/config.js");
}
