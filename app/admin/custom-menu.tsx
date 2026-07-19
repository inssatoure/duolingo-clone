"use client";

import { Menu } from "react-admin";

export const CustomMenu = () => (
  <Menu>
    <Menu.ResourceItems />
    <Menu.Item to="/import" primaryText="CSV Import" />
    <Menu.Item to="/media" primaryText="Media Library" />
    <Menu.Item to="/seed" primaryText="Seed Database" />
    <Menu.Item to="/studio" primaryText="🎙️ Recording Studio" />
  </Menu>
);
