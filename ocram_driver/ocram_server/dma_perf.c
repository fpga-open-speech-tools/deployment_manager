#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <errno.h>
#include <stdint.h>

#include "minimal-ws-server.c"

int main(int argc, char **argv) {
  struct timeval t0, t1;
  unsigned int i;
  int fd, addr_fd;
  unsigned int values[512];
  char addr_c[256][8];

  attach_message_receive_callback(&send_message_all_clients);
  start_socket(argc, argv);
  /*
  if( ( fd = open( "/sys/class/fe_dma/fe_dma0/memory", ( O_WRONLY) ) ) == -1 ) {
      printf( "ERROR: could not open \"/dev/mem\"...\n" );
      return( 1 );
    }
  printf("Opened the device!\n");

  char d[1536];
  for(i = 0; i < 512; i++){
    sprintf(d, "%u %u", i, i);
    write(fd, &d, 1536);
  }

  close(fd);

  if( ( addr_fd = open( "/sys/class/fe_dma/fe_dma0/address", ( O_WRONLY) ) ) == -1 ) {
      printf( "ERROR: could not open \"/dev/mem\"...\n" );
      return( 1 );
    }
  printf("Opened the device!\n");

  

  if( ( fd = open( "/sys/class/fe_dma/fe_dma0/memory", ( O_RDONLY) ) ) == -1 ) {
      printf( "ERROR: could not open \"/dev/mem\"...\n" );
      return( 1 );
    }
  printf("Opened the device!\n");

  gettimeofday(&t0, NULL);
  write(addr_fd, addr_c, 8);
  // for(i = 0; i < 256; i++){
  //     sprintf(addr_c[i], "%u", i);
  //   }


  for(int j = 0; j < 1000; j++){
      //write(addr_fd, addr_c, 8);
      read(fd, &d, 1536);
      //for(int q = 0; q < 16; q++)
      //  values[i + q] = atoi(d);
      
      //sscanf(d, "%u %u %u %u %u %u %u %u %u %u %u %u %u %u %u %u", &values[i], &values[i +1], &values[i+2], &values[i+3], &values[i+4], &values[i+5], &values[i+6], &values[i+7], &values[i+8], &values[i+9], &values[i+10], &values[i+11], &values[i+12], &values[i+13], &values[i+14], &values[i+15]);
  }
  gettimeofday(&t1, NULL);
  close(fd);
  close(addr_fd);

  printf("%s \n", d);

  // for(i = 0; i < 256; i++){
  //   //sprintf(d, "%u %u", i, i);
  //   printf(" %u, ", values[i]);
  //   if (i % 10 == 0){
  //     printf("\n");
  //   }
  // }

  printf("Did %u calls in %.5g seconds\n", 48000, t1.tv_sec - t0.tv_sec + 1E-6 * (t1.tv_usec - t0.tv_usec));
  */

  return 0;
}