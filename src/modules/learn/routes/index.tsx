import { Route } from "react-router-dom";
import { Learn, CourseDetail } from "../index";

export const learnRoutes = (
  <>
    <Route path="/learn" element={<Learn />} />
    <Route path="/learn/course/:slug" element={<CourseDetail />} />
  </>
);
