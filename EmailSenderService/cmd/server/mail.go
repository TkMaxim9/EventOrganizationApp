package main

import (
	"EmailSenderService/pkg/api"
	"EmailSenderService/pkg/emailsender"
	"log"
	"net"

	"google.golang.org/grpc"
)

func main() {
	s := grpc.NewServer()

	srv := &emailsender.GRPCServer{}
	api.RegisterEmailSenderServer(s, srv)

	l, err := net.Listen("tcp", ":2282")
	if err != nil {
		log.Fatal(err)
	}

	if err := s.Serve(l); err != nil {
		log.Fatal()
	}
}
