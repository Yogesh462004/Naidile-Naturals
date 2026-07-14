<script lang="ts">
	import Button from './Button.svelte';

	let { open = $bindable(false), returnUrl = '/' }: { open: boolean; returnUrl?: string } = $props();

	let closeButton: HTMLButtonElement | undefined = $state();

	$effect(() => {
		if (open) closeButton?.focus();
	});

	function close() {
		open = false;
	}
</script>

{#if open}
	<div
		class="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="login-required-title"
		aria-describedby="login-required-desc"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative w-full max-w-sm rounded-[24px] border border-line bg-white p-6 text-center shadow-card"
			onclick={(e) => e.stopPropagation()}
		>
			<button
				bind:this={closeButton}
				class="absolute top-4 right-4 text-muted hover:text-ink"
				onclick={close}
				aria-label="Close modal"
			>
				✕
			</button>

			<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream-deep text-2xl">
				🔒
			</div>

			<h3 id="login-required-title" class="serif mt-4 text-xl font-medium text-ink">Login Required</h3>

			<p id="login-required-desc" class="mt-2 text-sm leading-relaxed text-body">
				Please login or create an account to continue shopping.
			</p>

			<div class="mt-6 flex flex-col gap-3">
				<a href="/login?next={encodeURIComponent(returnUrl)}" class="w-full">
					<Button variant="terracotta" class="w-full">Login</Button>
				</a>
				<a href="/signup?next={encodeURIComponent(returnUrl)}" class="w-full">
					<Button variant="secondary" class="w-full">Register</Button>
				</a>
			</div>
		</div>
	</div>
{/if}
