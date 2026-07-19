"use client";

import simpleRestProvider from "ra-data-simple-rest";
import { Admin, CustomRoutes, Layout, type LayoutProps, Resource } from "react-admin";
import { Route } from "react-router-dom";

import { ChallengeCreate } from "./challenge/create";
import { ChallengeEdit } from "./challenge/edit";
import { ChallengeList } from "./challenge/list";
import { ChallengeOptionCreate } from "./challengeOption/create";
import { ChallengeOptionEdit } from "./challengeOption/edit";
import { ChallengeOptionsList } from "./challengeOption/list";
import { CourseCreate } from "./course/create";
import { CourseEdit } from "./course/edit";
import { CourseList } from "./course/list";
import { CustomMenu } from "./custom-menu";
import { CsvImportPage } from "./import/csv-import-page";
import { MediaPage } from "./media/media-page";
import { SeedPage } from "./seed/seed-page";
import { StudioPage } from "./studio/studio-page";
import { LessonCreate } from "./lesson/create";
import { LessonEdit } from "./lesson/edit";
import { LessonList } from "./lesson/list";
import { UnitCreate } from "./unit/create";
import { UnitEdit } from "./unit/edit";
import { UnitList } from "./unit/list";

const dataProvider = simpleRestProvider("/api");

const CustomLayout = (props: LayoutProps) => <Layout {...props} menu={CustomMenu} />;

const AppContent = () => {
  return (
    <Admin dataProvider={dataProvider} layout={CustomLayout}>
      <CustomRoutes>
        <Route path="/import" element={<CsvImportPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/seed" element={<SeedPage />} />
        <Route path="/studio" element={<StudioPage />} />
      </CustomRoutes>

      <Resource
        name="courses"
        recordRepresentation="title"
        list={CourseList}
        create={CourseCreate}
        edit={CourseEdit}
      />

      <Resource
        name="units"
        recordRepresentation="title"
        list={UnitList}
        create={UnitCreate}
        edit={UnitEdit}
      />

      <Resource
        name="lessons"
        recordRepresentation="title"
        list={LessonList}
        create={LessonCreate}
        edit={LessonEdit}
      />

      <Resource
        name="challenges"
        recordRepresentation="question"
        list={ChallengeList}
        create={ChallengeCreate}
        edit={ChallengeEdit}
      />

      <Resource
        name="challengeOptions"
        recordRepresentation="text"
        list={ChallengeOptionsList}
        create={ChallengeOptionCreate}
        edit={ChallengeOptionEdit}
        options={{
          label: "Challenge Options",
        }}
      />
    </Admin>
  );
};

export default AppContent;
