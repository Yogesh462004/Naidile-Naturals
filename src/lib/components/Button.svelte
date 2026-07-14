<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		type = 'button',
		disabled = false,
		class: className = '',
		onclick,
		children
	}: {
		variant?: 'primary' | 'secondary' | 'terracotta';
		type?: 'button' | 'submit';
		disabled?: boolean;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	} = $props();

	const base =
		'block w-full rounded-full py-3.5 px-6 text-center text-[0.85rem] font-medium tracking-[0.08em] uppercase transition-all duration-200 cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-olive-deep/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:scale-100';
	const variants = {
		primary: 'bg-olive-deep text-white hover:bg-olive-deep/90',
		secondary: 'border border-line bg-transparent text-olive-deep hover:bg-stone-100/50',
		terracotta: 'bg-terracotta text-white hover:opacity-95'
	};
</script>

<button {type} {disabled} {onclick} class="{base} {variants[variant]} {className}">
	{@render children()}
</button>
