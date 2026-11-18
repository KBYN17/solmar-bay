// Solmar Bay — keyboard and mouse input: one shared key set plus the
// mouse position in world coordinates.
export function createInput() {
  return {
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    clicked: false,
    attach(canvas) {
      window.addEventListener('keydown', (e) => {
        this.keys.add(e.key.toLowerCase());
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      });
      window.addEventListener('keyup', (e) => {
        this.keys.delete(e.key.toLowerCase());
      });
      window.addEventListener('blur', () => this.keys.clear());
      canvas.addEventListener('mousemove', (e) => {
        const r = canvas.getBoundingClientRect();
        this.mouseX = e.clientX - r.left;
        this.mouseY = e.clientY - r.top;
      });
      canvas.addEventListener('mousedown', (e) => {
        const r = canvas.getBoundingClientRect();
        this.mouseX = e.clientX - r.left;
        this.mouseY = e.clientY - r.top;
        this.mouseDown = true;
        this.clicked = true;
      });
      window.addEventListener('mouseup', () => { this.mouseDown = false; });
    },
    down(...names) {
      return names.some((n) => this.keys.has(n));
    },
    pressed(name) {
      if (this.keys.has(name)) {
        this.keys.delete(name);
        return true;
      }
      return false;
    },
    consumeClick() {
      const c = this.clicked;
      this.clicked = false;
      return c;
    },
  };
}
