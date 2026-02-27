import { boot } from 'quasar/wrappers';

const mouseUpHandlers = new WeakMap<HTMLInputElement, (event: MouseEvent) => void>();

function selectAllText(input: HTMLInputElement) {
  const handler = (event: MouseEvent) => {
    event.preventDefault();
    input.removeEventListener('mouseup', handler);
    mouseUpHandlers.delete(input);
  };

  if (!mouseUpHandlers.has(input)) {
    mouseUpHandlers.set(input, handler);
    input.addEventListener('mouseup', handler);
  }

  requestAnimationFrame(() => {
    if (document.activeElement === input) {
      input.select();
    }
  });
}

function shouldAutoSelect(target: EventTarget | null): target is HTMLInputElement {
  if (!(target instanceof HTMLInputElement)) {
    return false;
  }

  if (target.type !== 'number') {
    return false;
  }

  return Boolean(target.closest('.q-field'));
}

export default boot(() => {
  if (typeof document === 'undefined') {
    return;
  }

  document.addEventListener(
    'focusin',
    (event) => {
      if (shouldAutoSelect(event.target)) {
        selectAllText(event.target);
      }
    },
    true,
  );
});
