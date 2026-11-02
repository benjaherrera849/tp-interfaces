document.addEventListener('DOMContentLoaded', ()=> {


   const carrito= document.getElementById('carrito');
   const botonPlus= document.getElementById('plus');

   carrito.addEventListener('click' , ()=> {
    carrito.classList.add('giratorio');
    console.log("entro");
    

   });

   botonPlus.addEventListener('click' , ()=> {
    botonPlus.classList.add('agrandado');
   });


});