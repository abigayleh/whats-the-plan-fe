// PillPicker options for where something lives: the personal space first (value `null`),
// then every group the user belongs to.
export const scopeOptions = (personalSpace, groups) => [
  { value: null, label: personalSpace.name },
  ...groups.map((group) => ({ value: group.id, label: group.name })),
];
