qplot3 <- function(data, mappings) {
  temp_dir <- tempdir()
  message(temp_dir)

  if (!file.exists(file.path(temp_dir, '3js'))) {
    plotter_dir <- system.file('3js', package='zzz')
    file.copy(plotter_dir, temp_dir, recursive=T)
    message(sprintf('from %s to %s', plotter_dir, temp_dir))
  }

  json_string <- jsonlite::toJSON(list(data=data, mappings=mappings), dataframe='columns', auto_unbox=T)

  write(json_string, file.path(temp_dir, '3js', 'query.json'));

  rstudioapi::viewer(paste0(file.path(temp_dir, '3js', 'index.html')))
}
