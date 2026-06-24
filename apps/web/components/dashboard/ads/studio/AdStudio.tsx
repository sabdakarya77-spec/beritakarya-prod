'use client';

import { StudioProvider } from './StudioContext';
import { StudioPreview } from './StudioPreview';

export function AdStudio() {
  return (
    <StudioProvider>
      <StudioPreview />
    </StudioProvider>
  );
}
