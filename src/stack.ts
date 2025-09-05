import * as StackModule from '@stackframe/stack';

export const stack = new StackModule.Stack({
  project: 'projectnine',
  // an empty object means use default settings
  // for all environments
  environments: {},
});
