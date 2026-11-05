/** A Column: its children stacked down a table, in its box. */
import { h } from "../jsx";
import type { Component } from "./context";
import { Box, Stack } from "./layout";

export const Column: Component = ({ node, fill, render }) => (
  <Box node={node} fill={fill}>
    <Stack node={node} render={render} />
  </Box>
);
