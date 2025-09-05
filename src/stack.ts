import { Stack } from '@stackframe/stack/server';

export const stack = new Stack({
  project: 'projectnine',
  // an empty object means use default settings
  // for all environments
  environments: {},
});
