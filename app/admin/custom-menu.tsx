"use client";

import { Menu } from "react-admin";

export const CustomMenu = () => (
  <Menu>
    <Menu.ResourceItems />
    <Menu.Item to="/import" primaryText="CSV Import" />
  </Menu>
);
