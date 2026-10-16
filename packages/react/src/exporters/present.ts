/** The list without its null and undefined items (anything but a list: none), as the exporters read their lists. */
export const present = (list: unknown): any[] => (list ? (Array.isArray(list) ? list.filter((item) => item != null) : []) : []);
