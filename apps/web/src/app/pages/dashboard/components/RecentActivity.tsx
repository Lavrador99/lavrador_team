import React from "react";
import styled from "styled-components";
import { formatDistanceToNow, parseISO } from "date-fns";

interface ActivityItem {
  clientId: string;
  clientName: string;
  action: string;
  date: string;
}

interface Props {
  items: ActivityItem[];
}

export const RecentActivity: React.FC<Props> = ({ items }) => (
  <Wrap>
    <Title>Actividade recente</Title>
    {items.length === 0 ? (
      <Empty>Sem actividade recente.</Empty>
    ) : (
      <List>
        {items.map((item, i) => (
          <Item key={i}>
            <Avatar>{item.clientName[0]?.toUpperCase()}</Avatar>
            <Info>
              <Name>{item.clientName}</Name>
              <Action>{item.action}</Action>
            </Info>
            <Date>{formatRelative(item.date)}</Date>
          </Item>
        ))}
      </List>
    )}
  </Wrap>
);

function formatRelative(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: undefined });
  } catch {
    return dateStr;
  }
}

const Wrap = styled.div`
  background: #111118;
  border: 1px solid #2a2a35;
  border-radius: 10px;
  padding: 20px;
`;

const Title = styled.div`
  font-family: "DM Mono", monospace;
  font-size: 11px;
  color: #666677;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 16px;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: rgba(200, 245, 66, 0.08);
  border: 1px solid rgba(200, 245, 66, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Syne", sans-serif;
  font-size: 12px;
  font-weight: 800;
  color: #c8f542;
  flex-shrink: 0;
`;

const Info = styled.div`
  flex: 1;
  overflow: hidden;
`;

const Name = styled.div`
  font-size: 13px;
  color: #e8e8f0;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Action = styled.div`
  font-family: "DM Mono", monospace;
  font-size: 10px;
  color: #666677;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Date = styled.div`
  font-family: "DM Mono", monospace;
  font-size: 10px;
  color: #444455;
  flex-shrink: 0;
`;

const Empty = styled.div`
  font-family: "DM Mono", monospace;
  font-size: 12px;
  color: #444455;
  padding: 16px 0;
`;
