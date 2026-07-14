let message = $state('');
let visible = $state(false);
let timer: ReturnType<typeof setTimeout>;

export function showToast(msg: string) {
	message = msg;
	visible = true;
	clearTimeout(timer);
	timer = setTimeout(() => (visible = false), 2200);
}

export const toastState = {
	get message() {
		return message;
	},
	get visible() {
		return visible;
	}
};
