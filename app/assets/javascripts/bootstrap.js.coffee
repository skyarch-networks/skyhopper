jQuery ->
  $("a[rel=popover]").popover()
  $(".tooltip").tooltip()
  $("a[rel=tooltip]").tooltip({placement:'right'})
  $('.dropdown-toggle').dropdown()
  $(".popovermore").popover().click( (e)->e.preventDefault() )
  $(".popover-help").popover().click( (e)->e.preventDefault() )
  $(document).on("click", "a[href=#]", (e)->e.preventDefault() )
  $(document).on("click", ".disabled", (e)->e.preventDefault() )
