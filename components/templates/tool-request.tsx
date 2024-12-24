import * as React from "react";

interface EmailTemplateProps {
  request: string;
}

export const ToolRequestTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  request,
}) => <p>{request}</p>;
