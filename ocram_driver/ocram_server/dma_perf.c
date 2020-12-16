#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <errno.h>
#include <stdint.h>

#include "minimal-ws-server.c"

struct wait_arg_struct {
  int * continueWait;
  int * ready;
};

extern int interrupted;

void* persistentReadRAM();
void* wait(void * arguments);
void readRAM(int addr, char buf[], int len);
void initializeRAM();



int main(int argc, const char **argv) {
  pthread_t thread_id;
  const int readLen = 16;
  char e[readLen];
  signal(SIGINT, sigint_handler);

  initializeRAM();

  //readRAM(1, e, readLen);

  pthread_create(&thread_id, NULL, &persistentReadRAM, NULL);

  attach_message_receive_callback(&send_message_all_clients);
  start_socket(argc, argv);

  while(interrupted == 0);

  return 0;
}

void* persistentReadRAM(){
  pthread_t thread_id;
  int * status, *readNow;
  unsigned int i = 0, n = 0;

  int val;

  struct wait_arg_struct wait_args;
  const int readLen = 16;
  char e[readLen];

  status = &interrupted;
  wait_args.continueWait = status;
  wait_args.ready = readNow;

  pthread_create(&thread_id, NULL, &wait, (void *) &wait_args);

  do{
    if(*readNow) {
      *readNow = 0;
      readRAM(n++, e, readLen);
      if(i++ == 10){
        i  = 0;
        printf("The string is %s \n", e);
      }
      if(n == 256){
        n = 0;
      }
    }
    usleep(5000);
  } while(*status == 0);



  return NULL;
}

void* wait(void * arguments) {
  int *continueWait, *ready;
  unsigned int i;
  struct wait_arg_struct *args = (struct wait_arg_struct *) arguments;
  continueWait = args->continueWait;
  ready = args->ready;

  do {
    usleep(1000 * 100);
    *ready = 1;
  } while(*continueWait == 0);

  return NULL;
}


void readRAM(int addr, char buf[], int len) {
  struct timeval t0, t1;
  unsigned int i;
  int size;
  int fd, addr_fd;
  char addr_c[8];

  sprintf(addr_c, "%d", addr);

  if( ( addr_fd = open( "/sys/class/fe_dma/fe_dma0/address", ( O_WRONLY) ) ) == -1 ) {
      printf( "ERROR: could not open \"/sys/class/fe_dma/fe_dma0/address\"...\n" );
      return;
    }
  //printf("Opened the device!\n");

  

  if( ( fd = open( "/sys/class/fe_dma/fe_dma0/memory", ( O_RDONLY) ) ) == -1 ) {
      printf( "ERROR: could not open \"/sys/class/fe_dma/fe_dma0/memory\"...\n" );
      return;
    }
  //printf("Opened the device!\n");

  write(addr_fd, addr_c, 8);
  
  close(addr_fd);
  size = read(fd, buf, len);
  if(size < len) {
    buf[size] = '\0';
  }
  else {
    buf[len - 1] = '\0';
  }
  close(fd);
  

  return;
}

void initializeRAM() {
  unsigned int i;
  int fd, addr_fd;
  
  if( ( fd = open( "/sys/class/fe_dma/fe_dma0/memory", ( O_WRONLY) ) ) == -1 ) {
      printf( "ERROR: could not open to write \"/sys/class/fe_dma/fe_dma0/memory\"...\n" );
      return;
    }
  printf("Opened the device!\n");

  char d[1536];
  for(i = 0; i < 512; i++){
    sprintf(d, "%u %u", i, i);
    write(fd, &d, 1536);
  }

  close(fd);
  return;
}


// int main(int argc, char **argv) {
//   struct timeval t0, t1;
//   unsigned int i;
//   int fd, addr_fd;
//   unsigned int values[512];
//   char addr_c[8];

//   sprintf(addr_c, "%u", 0);

//   // attach_message_receive_callback(&send_message_all_clients);
//   // start_socket(argc, argv);
  
//   if( ( fd = open( "/sys/class/fe_dma/fe_dma0/memory", ( O_WRONLY) ) ) == -1 ) {
//       printf( "ERROR: could not open to write \"/sys/class/fe_dma/fe_dma0/memory\"...\n" );
//       return( 1 );
//     }
//   printf("Opened the device!\n");

//   char d[1536];
//   for(i = 0; i < 512; i++){
//     sprintf(d, "%u %u", i, i);
//     write(fd, &d, 1536);
//   }

//   close(fd);

//   if( ( addr_fd = open( "/sys/class/fe_dma/fe_dma0/address", ( O_WRONLY) ) ) == -1 ) {
//       printf( "ERROR: could not open \"/sys/class/fe_dma/fe_dma0/address\"...\n" );
//       return( 1 );
//     }
//   printf("Opened the device!\n");

//   write(addr_fd, addr_c, 8);
  
//   close(addr_fd);

//   if( ( fd = open( "/sys/class/fe_dma/fe_dma0/memory", ( O_RDONLY) ) ) == -1 ) {
//       printf( "ERROR: could not open \"/sys/class/fe_dma/fe_dma0/memory\"...\n" );
//       return( 1 );
//     }
//   printf("Opened the device!\n");

//   gettimeofday(&t0, NULL);

//   // for(i = 0; i < 256; i++){
//   //     sprintf(addr_c[i], "%u", i);
//   //   }


//   for(int j = 0; j < 10; j++){
//       //write(addr_fd, addr_c, 8);
//       read(fd, &d, 1536);
//       printf("%s \n", d);
//       //for(int q = 0; q < 16; q++)
//       //  values[i + q] = atoi(d);
      
//       //sscanf(d, "%u %u %u %u %u %u %u %u %u %u %u %u %u %u %u %u", &values[i], &values[i +1], &values[i+2], &values[i+3], &values[i+4], &values[i+5], &values[i+6], &values[i+7], &values[i+8], &values[i+9], &values[i+10], &values[i+11], &values[i+12], &values[i+13], &values[i+14], &values[i+15]);
//   }
//   gettimeofday(&t1, NULL);
//   close(fd);

//   printf("%s \n", d);

//   // for(i = 0; i < 256; i++){
//   //   //sprintf(d, "%u %u", i, i);
//   //   printf(" %u, ", values[i]);
//   //   if (i % 10 == 0){
//   //     printf("\n");
//   //   }
//   // }

//   printf("Did %u calls in %.5g seconds\n", 1000, t1.tv_sec - t0.tv_sec + 1E-6 * (t1.tv_usec - t0.tv_usec));
  

//   return 0;
// }