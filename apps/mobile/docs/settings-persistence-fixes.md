# Settings Persistence Fixes

This patch keeps the stable self-contained Settings screen and fixes three behavior issues:

- Unit toggles update the local draft and global settings context immediately.
- Body weight/height displays follow the selected kg/lbs and m/in units.
- Profile photo selection is saved to WatermelonDB immediately and displayed inside the avatar.
- The model confidence slider uses absolute track measurement for smoother dragging and keeps the thumb text-free.
