#' qplot3
#'
#' @export
qplot3 <- function(data, mappings, verbose_level=0) {
  temp_dir <- tempdir()
  if (verbose_level > 1) message(sprintf('Creating directory %s', temp_dir))

  if (!file.exists(file.path(temp_dir, '3js'))) {
    plotter_dir <- system.file('3js', package='zzz')
    file.copy(plotter_dir, temp_dir, recursive=T)
    message(sprintf('from %s to %s', plotter_dir, temp_dir))
  }

  json_string <- jsonlite::toJSON(list(data=data, mappings=mappings), dataframe='columns', auto_unbox=T)

  write(json_string, file.path(temp_dir, '3js', 'query.json'));

  rstudioapi::viewer(paste0(file.path(temp_dir, '3js', 'index.html')))
}
