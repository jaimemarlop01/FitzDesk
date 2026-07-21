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
"aoc-q27p3cv-analisis.md": {
	id: "aoc-q27p3cv-analisis.md";
  slug: "aoc-q27p3cv-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"asus-rog-strix-scar-18-analisis.md": {
	id: "asus-rog-strix-scar-18-analisis.md";
  slug: "asus-rog-strix-scar-18-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
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
  slug: "adata-urban-tapsafe";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-airra-labs-rotary-mouse-analisis.md": {
	id: "borrador-airra-labs-rotary-mouse-analisis.md";
  slug: "airra-labs-rotary-mouse-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-asus-portatiles-trabajo-exigente-2026.md": {
	id: "borrador-asus-portatiles-trabajo-exigente-2026.md";
  slug: "asus-portatiles-trabajo-exigente-2026";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-asus-proart-pa278cv-analisis.md": {
	id: "borrador-asus-proart-pa278cv-analisis.md";
  slug: "asus-proart-pa278cv-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-asus-vivobook-15-oferta.md": {
	id: "borrador-asus-vivobook-15-oferta.md";
  slug: "asus-vivobook-15-oferta";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-benq-pd2705q-analisis.md": {
	id: "borrador-benq-pd2705q-analisis.md";
  slug: "benq-pd2705q-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-cherry-kc-6000-slim-analisis.md": {
	id: "borrador-cherry-kc-6000-slim-analisis.md";
  slug: "cherry-kc-6000-slim-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-corsair-k70-core-tkl-analisis.md": {
	id: "borrador-corsair-k70-core-tkl-analisis.md";
  slug: "corsair-k70-core-tkl-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-corsair-xeneon-edge-analisis.md": {
	id: "borrador-corsair-xeneon-edge-analisis.md";
  slug: "corsair-xeneon-edge-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-doble-monitor-teletrabajo-merece-la-pena.md": {
	id: "borrador-doble-monitor-teletrabajo-merece-la-pena.md";
  slug: "doble-monitor-teletrabajo-merece-la-pena";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-jabra-evolve2-30-se-analisis.md": {
	id: "borrador-jabra-evolve2-30-se-analisis.md";
  slug: "jabra-evolve2-30-se-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-keychron-k2-max-analisis.md": {
	id: "borrador-keychron-k2-max-analisis.md";
  slug: "keychron-k2-max-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-logitech-brio-505-analisis.md": {
	id: "borrador-logitech-brio-505-analisis.md";
  slug: "logitech-brio-505-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-logitech-mk470-analisis.md": {
	id: "borrador-logitech-mk470-analisis.md";
  slug: "logitech-mk470-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-logitech-mx-mechanical-analisis.md": {
	id: "borrador-logitech-mx-mechanical-analisis.md";
  slug: "logitech-mx-mechanical-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-logitech-mx-vertical-analisis.md": {
	id: "borrador-logitech-mx-vertical-analisis.md";
  slug: "logitech-mx-vertical-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-logitech-pop-keys-analisis.md": {
	id: "borrador-logitech-pop-keys-analisis.md";
  slug: "logitech-pop-keys-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-logitech-signature-m650-analisis.md": {
	id: "borrador-logitech-signature-m650-analisis.md";
  slug: "logitech-signature-m650-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-mejor-teclado-mecanico-teletrabajo-2026.md": {
	id: "borrador-mejor-teclado-mecanico-teletrabajo-2026.md";
  slug: "mejor-teclado-mecanico-teletrabajo-2026";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-mejores-soportes-brazos-monitor-teletrabajo-2026.md": {
	id: "borrador-mejores-soportes-brazos-monitor-teletrabajo-2026.md";
  slug: "mejores-soportes-brazos-monitor-teletrabajo-2026";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-microsoft-bluetooth-ergonomic-mouse-analisis.md": {
	id: "borrador-microsoft-bluetooth-ergonomic-mouse-analisis.md";
  slug: "microsoft-bluetooth-ergonomic-mouse-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-monitor-ultrawide-teletrabajo-merece-la-pena.md": {
	id: "borrador-monitor-ultrawide-teletrabajo-merece-la-pena.md";
  slug: "monitor-ultrawide-teletrabajo-merece-la-pena";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-msi-pro-mp341cq-analisis.md": {
	id: "borrador-msi-pro-mp341cq-analisis.md";
  slug: "msi-pro-mp341cq-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-razer-seiren-v3-pro-analisis.md": {
	id: "borrador-razer-seiren-v3-pro-analisis.md";
  slug: "razer-seiren-v3-pro-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"borrador-trust-tk-350-silent-analisis.md": {
	id: "borrador-trust-tk-350-silent-analisis.md";
  slug: "trust-tk-350-silent-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"corsair-presenta-en-computex-b2026b-el-teclado-clipper-pro-mini-60-el-raton---ge.md": {
	id: "corsair-presenta-en-computex-b2026b-el-teclado-clipper-pro-mini-60-el-raton---ge.md";
  slug: "corsair-presenta-en-computex-b2026b-el-teclado-clipper-pro-mini-60-el-raton---ge";
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
"dolor-muneca-teletrabajo-perifericos-ergonomicos.md": {
	id: "dolor-muneca-teletrabajo-perifericos-ergonomicos.md";
  slug: "dolor-muneca-teletrabajo-perifericos-ergonomicos";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"el-nuevo-surface-ultra-con-el-rtx-spark-de-nvidia-cuenta-con-un-misterioso-puert.md": {
	id: "el-nuevo-surface-ultra-con-el-rtx-spark-de-nvidia-cuenta-con-un-misterioso-puert.md";
  slug: "el-nuevo-surface-ultra-con-el-rtx-spark-de-nvidia-cuenta-con-un-misterioso-puert";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"hp-935-creator-wireless-analisis.md": {
	id: "hp-935-creator-wireless-analisis.md";
  slug: "hp-935-creator-wireless-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"hp-probook-455-g10-analisis.md": {
	id: "hp-probook-455-g10-analisis.md";
  slug: "hp-probook-455-g10-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"intel-wildcat-lake-golpeara-al-apple-macbook-neo-los-portatiles-x86-podran-usar-.md": {
	id: "intel-wildcat-lake-golpeara-al-apple-macbook-neo-los-portatiles-x86-podran-usar-.md";
  slug: "intel-wildcat-lake-golpeara-al-apple-macbook-neo-los-portatiles-x86-podran-usar-";
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
"lg-display-muestra-el-futuro-de-los-monitores-oled-gaming-con-2000-nits-5k-27-22.md": {
	id: "lg-display-muestra-el-futuro-de-los-monitores-oled-gaming-con-2000-nits-5k-27-22.md";
  slug: "lg-display-muestra-el-futuro-de-los-monitores-oled-gaming-con-2000-nits-5k-27-22";
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
"lg-ultragear-34gx90sb-w-analisis.md": {
	id: "lg-ultragear-34gx90sb-w-analisis.md";
  slug: "lg-ultragear-34gx90sb-w-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"logitech-k380-analisis.md": {
	id: "logitech-k380-analisis.md";
  slug: "logitech-k380-analisis";
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
"logitech-mobi-fold-analisis.md": {
	id: "logitech-mobi-fold-analisis.md";
  slug: "logitech-mobi-fold-analisis";
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
"mejor-monitor-teletrabajo-2026-guia.md": {
	id: "mejor-monitor-teletrabajo-2026-guia.md";
  slug: "mejor-monitor-teletrabajo-2026-guia";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"mejor-raton-teletrabajo-presupuesto-2026.md": {
	id: "mejor-raton-teletrabajo-presupuesto-2026.md";
  slug: "mejor-raton-teletrabajo-presupuesto-2026";
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
"monitor-4k-vs-full-hd-teletrabajo-2026.md": {
	id: "monitor-4k-vs-full-hd-teletrabajo-2026.md";
  slug: "monitor-4k-vs-full-hd-teletrabajo-2026";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"portatil-vs-sobremesa-teletrabajo-2026.md": {
	id: "portatil-vs-sobremesa-teletrabajo-2026.md";
  slug: "portatil-vs-sobremesa-teletrabajo-2026";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"razer-pro-click-analisis.md": {
	id: "razer-pro-click-analisis.md";
  slug: "razer-pro-click-analisis";
  body: string;
  collection: "articulos";
  data: InferEntrySchema<"articulos">
} & { render(): Render[".md"] };
"samsung-s27a600-analisis.md": {
	id: "samsung-s27a600-analisis.md";
  slug: "samsung-s27a600-analisis";
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
"teclado-mecanico-vs-membrana-teletrabajo-2026.md": {
	id: "teclado-mecanico-vs-membrana-teletrabajo-2026.md";
  slug: "teclado-mecanico-vs-membrana-teletrabajo-2026";
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
