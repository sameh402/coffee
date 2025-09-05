import { DemoResponse } from "@shared/api";
import { useEffect, useState } from "react";

import { Navigate } from "react-router-dom";

export default function Index() {
  return <Navigate to="/overview" replace />;
}
