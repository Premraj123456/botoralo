import { Stack as StackConstructor } from '@stackframe/stack';

export const stack = new StackConstructor({
  project: 'projectnine',
  // an empty object means use default settings
  // for all environments
  environments: {},
});
