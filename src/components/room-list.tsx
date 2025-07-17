import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type GetRoomsAPIResponse = Array<{
  id: string;
  name: string;
  questionCount: number;
  createdAt: string;
}>;

export function RoomList() {
  const { data, isLoading } = useQuery({
    queryKey: ['get-rooms'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3333/rooms');
      const result: GetRoomsAPIResponse = await response.json();
      return result;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sala recentes</CardTitle>
        <CardDescription>
          Acesso rápido para as salas criadas recentemente
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading && (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        )}

        {data?.map((room) => {
          return (
            <Link
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
              key={room.id}
              to={'/rooms/&{room.id}'}
            >
              <div className="flex-1 flex-col gap-1">
                <h3 className="font-medium ">{room.name}</h3>
                <div className="flex items-center gap-1">
                  <Badge className="text-xs" variant="secondary">
                    {dayjs(room.createdAt).toNow()}
                  </Badge>
                  <Badge className="text-xs" variant="secondary">
                    {room.questionCount} pergunta(s)
                  </Badge>
                </div>
              </div>

              <span>
                Entrar
                <ArrowRight className="size-3 gap-1 text-sm" />
              </span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
